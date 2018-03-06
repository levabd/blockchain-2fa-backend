export class Service {

    /**
     *
     * @param {string} Name - Name of the service
     * @param {string} Secret - Secret which will be used for integration
     * @param {string} Channel - Service's channel
     * @param {string} Chaincode - Service's Chaincode
     */
    constructor(private Name: string,
                private Secret: string,
                private Channel: string,
                private Chaincode: string) {
    }

    getName(): string {
        return this.Name;
    }

    setName(name: string): void {
        this.Name = name;
    }

    getChaincode(): string {
        return this.Chaincode;
    }

    setChaincode(chaincode: string): void {
        this.Chaincode = chaincode;
    }

    getKey(): string {
        return this.Name;
    }

    setKey(key: string): void {
        this.Secret = key;
    }

    getChannel(): string {
        return this.Channel;
    }

    setChannel(channel: string): void {
        this.Channel = channel;
    }
}