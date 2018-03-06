import {Component} from '@nestjs/common';

@Component()
export class TimeHelper {

    /**
     * Get Unix timestamp with 'minutes' after now
     *
     * @param {number} minutes
     * @param returnDate
     * @returns {number}
     */
    getUnixTimeAfterMinutes(minutes: number, returnDate?: boolean): number | Date {
        const now: Date = new Date();
        const then: Date = new Date();
        then.setMinutes(now.getMinutes() + minutes);
        const result = then.getTime() / 1000;

        return returnDate ? new Date(result * 1000) : result;
    }

    /**
     * Check if date expires
     *
     * @param {number} unixtime
     * @returns {boolean}
     */
    dateExpires(unixtime: number): boolean {

        const now: Date = new Date();
        const checkedDate: Date = new Date(unixtime * 1000);

        return now.getTime() > checkedDate.getTime();
    }
}