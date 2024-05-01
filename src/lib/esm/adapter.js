import Web3Modal from '@walletconnect/legacy-modal';
import WalletConnectClient from '@walletconnect/sign-client';
import { getSdkError } from '@walletconnect/utils';
import { ClientNotInitializedError, QRCodeModalError } from './errors.js';
export var WalletConnectChainID;
(function (WalletConnectChainID) {
    WalletConnectChainID["Mainnet"] = "tron:0x2b6653dc";
    WalletConnectChainID["Shasta"] = "tron:0x94a9059e";
    WalletConnectChainID["Nile"] = "tron:0xcd8690dc";
})(WalletConnectChainID || (WalletConnectChainID = {}));
export var WalletConnectMethods;
(function (WalletConnectMethods) {
    WalletConnectMethods["signTransaction"] = "tron_signTransaction";
    WalletConnectMethods["signMessage"] = "tron_signMessage";
})(WalletConnectMethods || (WalletConnectMethods = {}));
const getConnectParams = (chainId, pairingTopic) => ({
    requiredNamespaces: {
        tron: {
            chains: [chainId],
            methods: [WalletConnectMethods.signTransaction, WalletConnectMethods.signMessage],
            events: []
        }
    },
    pairingTopic: pairingTopic
});
export class WalletConnectWallet {
    constructor(config) {
        this.web3Modal = Web3Modal;
        this._options = config.options;
        this._network = config.network;
        this.qrcodeModalOptions = config.qrcodeModalOptions || {};
    }
    async connect() {
        const client = this._client ?? (await WalletConnectClient.init(this._options));
        const sessions = client.find(getConnectParams(this._network)).filter(s => s.acknowledged);
        if (sessions.length) {
            // select last matching session
            this._session = sessions[sessions.length - 1];
            // We assign this variable only after we're sure we've received approval
            this._client = client;
            this._client = client;
            const accounts = Object.values(this._session.namespaces)
                .map(namespace => namespace.accounts)
                .flat();
            this.address = accounts[0].split(':')[2];
            return {
                address: this.address
            };
        }
        else {
            const { uri, approval } = await client.connect(getConnectParams(this._network));
            return new Promise((resolve, reject) => {
                if (uri) {
                    this.web3Modal.open(uri, () => {
                        reject(new QRCodeModalError('QR Code Modal Closed'));
                    }, this.qrcodeModalOptions);
                }
                approval()
                    .then(session => {
                    this._session = session;
                    // We assign this variable only after we're sure we've received approval
                    this._client = client;
                    const accounts = Object.values(this._session.namespaces)
                        .map(namespace => namespace.accounts)
                        .flat();
                    this.address = accounts[0].split(':')[2];
                    resolve({ address: this.address });
                })
                    .catch(reject)
                    .finally(() => {
                    this.web3Modal.close();
                });
            });
        }
    }
    async disconnect() {
        if (this._client && this._session) {
            await this._client.disconnect({
                topic: this._session.topic,
                reason: getSdkError('USER_DISCONNECTED')
            });
            this._session = undefined;
        }
        else {
            throw new ClientNotInitializedError();
        }
    }
    get client() {
        if (this._client) {
            return Object.assign({}, this._client, { off: this._client.removeListener });
        }
        else {
            throw new ClientNotInitializedError();
        }
    }
    async checkConnectStatus() {
        const client = this._client ?? (await WalletConnectClient.init(this._options));
        const sessions = client.find(getConnectParams(this._network)).filter(s => s.acknowledged);
        if (sessions.length) {
            // select last matching session
            this._session = sessions[sessions.length - 1];
            // We assign this variable only after we're sure we've received approval
            this._client = client;
            const accounts = Object.values(this._session.namespaces)
                .map(namespace => namespace.accounts)
                .flat();
            this.address = accounts[0].split(':')[2];
            return {
                address: this.address
            };
        }
        else {
            return {
                address: ''
            };
        }
    }
    async signTransaction(transaction) {
        if (this._client && this._session) {
            const { result } = await this._client.request({
                chainId: this._network,
                topic: this._session.topic,
                request: {
                    method: WalletConnectMethods.signTransaction,
                    params: {
                        address: this.address,
                        transaction: { ...transaction }
                    }
                }
            });
            return result;
        }
        else {
            throw new ClientNotInitializedError();
        }
    }
    async signMessage(message) {
        if (this._client && this._session) {
            const { signature } = await this._client.request({
                chainId: this._network,
                topic: this._session.topic,
                request: {
                    method: WalletConnectMethods.signMessage,
                    params: {
                        address: this.address,
                        message
                    }
                }
            });
            return signature;
        }
        else {
            throw new ClientNotInitializedError();
        }
    }
}