"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
let TimeHelper = class TimeHelper {
    getUnixTimeAfterMinutes(minutes, returnDate) {
        const now = new Date();
        const then = new Date();
        then.setMinutes(now.getMinutes() + minutes);
        const result = then.getTime() / 1000;
        return returnDate ? new Date(result * 1000) : result;
    }
    dateExpires(unixtime) {
        const now = new Date();
        const checkedDate = new Date(unixtime * 1000);
        return now.getTime() > checkedDate.getTime();
    }
};
TimeHelper = __decorate([
    common_1.Component()
], TimeHelper);
exports.TimeHelper = TimeHelper;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvc2VydmljZXMvaGVscGVycy90aW1lLmhlbHBlci50cyIsInNvdXJjZXMiOlsiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvc2VydmljZXMvaGVscGVycy90aW1lLmhlbHBlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBLDJDQUF5QztBQUd6QyxJQUFhLFVBQVUsR0FBdkI7SUFTSSx1QkFBdUIsQ0FBQyxPQUFlLEVBQUUsVUFBb0I7UUFDekQsTUFBTSxHQUFHLEdBQVMsSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUM3QixNQUFNLElBQUksR0FBUyxJQUFJLElBQUksRUFBRSxDQUFDO1FBQzlCLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxHQUFHLE9BQU8sQ0FBQyxDQUFDO1FBQzVDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFFckMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7SUFDekQsQ0FBQztJQVFELFdBQVcsQ0FBQyxRQUFnQjtRQUV4QixNQUFNLEdBQUcsR0FBUyxJQUFJLElBQUksRUFBRSxDQUFDO1FBQzdCLE1BQU0sV0FBVyxHQUFTLElBQUksSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUVwRCxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNqRCxDQUFDO0NBQ0osQ0FBQTtBQS9CWSxVQUFVO0lBRHRCLGtCQUFTLEVBQUU7R0FDQyxVQUFVLENBK0J0QjtBQS9CWSxnQ0FBVSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7Q29tcG9uZW50fSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XG5cbkBDb21wb25lbnQoKVxuZXhwb3J0IGNsYXNzIFRpbWVIZWxwZXIge1xuXG4gICAgLyoqXG4gICAgICogR2V0IFVuaXggdGltZXN0YW1wIHdpdGggJ21pbnV0ZXMnIGFmdGVyIG5vd1xuICAgICAqXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IG1pbnV0ZXNcbiAgICAgKiBAcGFyYW0gcmV0dXJuRGF0ZVxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XG4gICAgICovXG4gICAgZ2V0VW5peFRpbWVBZnRlck1pbnV0ZXMobWludXRlczogbnVtYmVyLCByZXR1cm5EYXRlPzogYm9vbGVhbik6IG51bWJlciB8IERhdGUge1xuICAgICAgICBjb25zdCBub3c6IERhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBjb25zdCB0aGVuOiBEYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgdGhlbi5zZXRNaW51dGVzKG5vdy5nZXRNaW51dGVzKCkgKyBtaW51dGVzKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhlbi5nZXRUaW1lKCkgLyAxMDAwO1xuXG4gICAgICAgIHJldHVybiByZXR1cm5EYXRlID8gbmV3IERhdGUocmVzdWx0ICogMTAwMCkgOiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgZGF0ZSBleHBpcmVzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gdW5peHRpbWVcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBkYXRlRXhwaXJlcyh1bml4dGltZTogbnVtYmVyKTogYm9vbGVhbiB7XG5cbiAgICAgICAgY29uc3Qgbm93OiBEYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgY29uc3QgY2hlY2tlZERhdGU6IERhdGUgPSBuZXcgRGF0ZSh1bml4dGltZSAqIDEwMDApO1xuXG4gICAgICAgIHJldHVybiBub3cuZ2V0VGltZSgpID4gY2hlY2tlZERhdGUuZ2V0VGltZSgpO1xuICAgIH1cbn0iXX0=