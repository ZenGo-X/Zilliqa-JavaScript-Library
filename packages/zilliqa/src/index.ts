import { HTTPProvider, Provider } from '@zilliqa-js/core';
import { TransactionFactory, Wallet } from '@zilliqa-js/account';
import { Contracts } from '@zilliqa-js/contract';
import { Blockchain, Network } from '@zilliqa-js/blockchain';
import { Server } from '@kzen-networks/zilliqa-account/dist/server';
import * as crypto from '@kzen-networks/zilliqa-crypto';

export class Zilliqa {
  provider: Provider;

  blockchain: Blockchain;
  network: Network;
  contracts: Contracts;
  transactions: TransactionFactory;
  wallet: Wallet;
  server: Server;
  crypto: any;

  constructor(node: string, provider?: Provider) {
    this.provider = provider || new HTTPProvider(node);
    this.wallet = new Wallet(this.provider);
    this.blockchain = new Blockchain(this.provider, this.wallet);
    this.network = new Network(this.provider, this.wallet);
    this.contracts = new Contracts(this.provider, this.wallet);
    this.transactions = new TransactionFactory(this.provider, this.wallet);
    this.server = new Server();
    this.crypto = crypto;
  }
}
