//
// import {UserController} from '../../src/routes/users/user.controller';
// import {TwoFaUserService} from '../../src/routes/2fa/2fa.service';
// import {RequestHelper} from '../../src/services/chain/requesthelper';
//
// describe('UserController', () => {
//     let _UserController: UserController;
//     let _TwoFaService: TwoFaUserService;
//
//     beforeEach(() => {
//         twoFaService = new TwoFaUserService( new RequestHelper());
//         catsController = new _UserController(twoFaService);
//     });
//
//     describe('findAll', () => {
//         it('should return an array of cats', async () => {
//             const result = ['test'];
//             jest.spyOn(catsService, 'findAll').mockImplementation(() => result);
//
//             expect(await catsController.findAll()).toBe(result);
//         });
//     });
// });