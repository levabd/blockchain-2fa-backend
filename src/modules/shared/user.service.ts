import {Component, InternalServerErrorException, BadRequestException} from '@nestjs/common';
import * as Yup from 'yup';
import {RequestHelper} from '../../services/chain/requesthelper';
import {TwoFACCMethods} from './models/chaincode/twofa/chaincode.methods.enum';
import {TwoFaUser} from './models/chaincode/twofa/user.model';
import {EnvConfig} from '../../config/env';
import {InvokeResult} from '../api/controllsers/invokeresult.model';
import {Log} from 'hlf-node-utils';

@Component()
export class TwoFaUserService {

    /**
     * Creates an instance of TwoFaUserService.
     * @param {RequestHelper} requestHelper
     * @memberof TwoFaUserService
     */
    constructor(private requestHelper: RequestHelper) {
    }

    /**
     *  Get user by it's index in ledger
     *
     * @returns {Promise<[]>}
     * @param phoneNumber
     */
    queryUser(phoneNumber: string): Promise<TwoFaUser> {
        Log.app.debug('phoneNumber', phoneNumber);
        // this is a query, query chaincode directly
        return this.requestHelper.queryRequest(TwoFACCMethods.queryUser, [phoneNumber], EnvConfig.TWOFA_CHAINCODE)
            .then(result => {
                return result;
            })
            .catch(error => {
                throw new InternalServerErrorException(error);
            });
    }

    /**
     * Set TwoFaChannel user push
     *
     * @param {string} phoneNumber
     * @param {string} pushToken
     * @returns {Promise<UserDto>}
     */
    setUserPush(phoneNumber: string, pushToken: string): Promise<TwoFaUser> {
        // this is a query, query chaincode directly
        return this.requestHelper.queryRequest(
            TwoFACCMethods.setUserPush,
            [phoneNumber, pushToken], EnvConfig.TWOFA_CHAINCODE
        ).then(result => {
            return result;
        }).catch(error => {
            throw new InternalServerErrorException(error);
        });
    }

    /**
     * create new car
     *
     * @param {TwoFaUser} TwoFaUser
     * @param {string} userId
     * @returns {Promise<InvokeResult>}
     * @memberof AssetsService
     */
    create(TwoFaUser: TwoFaUser, userId: string): Promise<InvokeResult> {
        const schema = Yup.object().shape({
            Key: Yup.string().required(),
            Make: Yup.string().required(),
            Model: Yup.string().required(),
            Colour: Yup.string().required(),
            Owner: Yup.string().required()
        });
        // TODO: replace yup with validation pipe
        return this.requestHelper.validateRequest(schema, TwoFaUser)
            .then(params => {
                return this.requestHelper.invokeRequest(TwoFACCMethods.createUser, params, EnvConfig.TWOFA_CHAINCODE)
                    .then(result => {
                        return result;
                    })
                    .catch(error => {
                        throw new InternalServerErrorException(error);
                    });
            })
            .catch(error => {
                throw new BadRequestException(error);
            });
    }
}
