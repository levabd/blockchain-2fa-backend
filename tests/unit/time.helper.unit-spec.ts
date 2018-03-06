import {TimeHelper} from '../../src/services/helpers/time.helper';

describe('TimeHelper', () => {
    let timeHelper: TimeHelper;

    beforeEach(() => {
        timeHelper = new TimeHelper();
    });

    it('getUnixTimeAfterMinutes should return correct unixtime after given minutes', () => {
        const minutes = 6;
        const now: Date = new Date();
        const then: Date = new Date();
        then.setMinutes(now.getMinutes() + minutes);
        const result = then.getTime() / 1000;

        const testDate = new Date(result*1000);
        const methodResut:any = timeHelper.getUnixTimeAfterMinutes(minutes);
        const dateFromMethod = new Date(methodResut*1000);

        expect(dateFromMethod.getMinutes()).toBe(now.getMinutes() + minutes);
        expect(dateFromMethod.getMinutes()).toBe(testDate.getMinutes());
    });

    it('getUnixTimeAfterMinutes should return date - not number', () => {
        const minutes = 10;
        const now: Date = new Date();
        const then: Date = new Date();
        then.setMinutes(now.getMinutes() + minutes);
        const result = then.getTime() / 1000;

        const testDate = new Date(result*1000);
        const methodResut: any = timeHelper.getUnixTimeAfterMinutes(minutes, true);

        expect(methodResut.getMinutes()).toBe(now.getMinutes() + minutes);
        expect(methodResut.getMinutes()).toBe(testDate.getMinutes());
    });

    it('dateExpires should return true if expires and versa', () => {
        const then: Date = new Date();
        then.setMinutes(then.getMinutes() -10);
        expect(timeHelper.dateExpires(then.getTime() / 1000)).toBe(true);

        then.setMinutes(then.getMinutes() + 50);
        expect(timeHelper.dateExpires(then.getTime() / 1000)).toBe(false);
    });
});