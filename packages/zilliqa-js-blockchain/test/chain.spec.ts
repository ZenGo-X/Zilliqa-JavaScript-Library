import { Transaction, Wallet } from '@zilliqa-js/account';
import { HTTPProvider } from '@zilliqa-js/core';
import { BN, Long } from '@zilliqa-js/util';

import { Blockchain } from '../src/chain';

import fetch from 'jest-fetch-mock';
import range from 'lodash.range';

const provider = new HTTPProvider('https://mock.com');
const wallet = new Wallet(provider);

describe('Module: Blockchain', () => {
  beforeAll(async () => {
    await Promise.all(
      range(10).map(async () => {
        await wallet.create();
      }),
    );
  });

  const blockchain = new Blockchain(provider, wallet);

  afterEach(() => {
    fetch.resetMocks();
  });

  it('should sign and send transactions', async () => {
    const tx = new Transaction(
      {
        version: 1,
        toAddr: '0x1234567890123456789012345678901234567890',
        amount: new BN(0),
        gasPrice: new BN(1000),
        gasLimit: Long.fromNumber(1000),
      },
      provider,
    );

    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          balance: 888,
          nonce: 1,
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          TranID: 'some_hash',
          Info: 'Non-contract txn, sent to shard',
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          ID: 'some_hash',
          receipt: { success: true },
        },
      },
    ].map((res) => [JSON.stringify(res)] as [string]);

    fetch.mockResponses(...responses);

    const { txParams } = await blockchain.createTransaction(tx);

    expect(txParams).toHaveProperty('signature');
    expect(txParams).toHaveProperty('pubKey');
    expect(tx.isConfirmed()).toEqual(true);
  });

  it('should respect the maxAttempts parameter', async () => {
    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          balance: 888,
          nonce: 1,
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          TranID: 'some_hash',
          Info: 'Non-contract txn, sent to shard',
        },
      },
      ...(() => {
        const mocks = [];

        for (let i = 0; i < 40; i++) {
          mocks.push({
            id: 1,
            jsonrpc: '2.0',
            error: {
              code: -888,
              message: 'Not found',
            },
          });
        }

        return mocks;
      })(),
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          ID: 'some_hash',
          receipt: { cumulative_gas: '1000', success: true },
        },
      },
    ].map((res) => [JSON.stringify(res)] as [string]);

    fetch.mockResponses(...responses);

    const tx = new Transaction(
      {
        version: 0,
        toAddr: '0x1234567890123456789012345678901234567890',
        amount: new BN(0),
        gasPrice: new BN(1000),
        gasLimit: Long.fromNumber(1000),
      },
      provider,
    );

    await expect(blockchain.createTransaction(tx, 40, 0)).rejects.toThrow(
      'The transaction is still not confirmed after 40 attempts.',
    );
  });
});
