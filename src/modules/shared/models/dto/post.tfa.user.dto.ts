export class TfaUserDTO {

    constructor(private PhoneNumber: string,
                private Uin: number,
                private Name: string,
                private IsVerified: boolean,
                private Email: string,
                private Sex: string,
                private Birthdate: number,
                private PushToken: string,
    ){}
}
