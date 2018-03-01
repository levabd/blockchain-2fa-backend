export class Service {

    /**
     *
     * @param {string} Name - Name of the service
     * @param {string} Secret - Secret which will be used for integration
     */
    constructor(private Name: string, private Secret: string){}

    getName():string{
        return this.Name;
    }

    setName(name :string):void{
        this.Name = name;
    }
    getKey():string{
        return this.Name;
    }

    setKey(key :string):void{
        this.Secret = key;
    }
}