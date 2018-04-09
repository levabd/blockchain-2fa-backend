import {ChainService} from '../../../services/sawtooth/chain.service';
import {PostClientUserDTO} from '../../shared/models/dto/post.kaztel.user.dto';
import {KaztelTransactionFamily} from '../../shared/families/kaztel.transaction.family';
import {TfaTransactionFamily} from '../../shared/families/tfa.transaction.family';
import {EgovTransactionFamily} from '../../shared/families/egov.transaction.family';

export class ApiController {

    constructor(public tfaTF: TfaTransactionFamily,
                public kaztelTF: KaztelTransactionFamily,
                public egovTF: EgovTransactionFamily,) {
    }

    async getUser(phoneNumber: string, service: string): Promise<PostClientUserDTO | null> {
        let user;
        try {
            if ( phoneNumber.charAt(0) === '+') {
                phoneNumber = phoneNumber.substring(1);
            }
            console.log('service', service);

            switch (service) {
                case 'kaztel':
                    console.log('phoneNumber', phoneNumber);
                    user = await this.kaztelTF.getUser(phoneNumber);
                    break;
                case 'egov':
                    user = await this.egovTF.getUser(phoneNumber);
                    break;
                default:
                    user = await this.tfaTF.getStateByPhoneNumber(phoneNumber);
                    break;
            }
            if (user.PhoneNumber == '') {
                return null;
            }
        } catch (e) {
            return null;
        }

        return user;
    }

    getUserNotFoundMessage(lang: string) {
        return lang === 'ru' ? 'Пользователь не найден' : 'User not found';
    }
}