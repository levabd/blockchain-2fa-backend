"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const crc32 = require("crc-32");
const crypto = require("crypto");
const env_1 = require("../../../config/env");
exports.md5 = (contents) => crypto.createHash('md5').update(contents).digest('hex');
const decimalToHexString = (number) => {
    if (number < 0) {
        number = 0xFFFFFFFF + number + 1;
    }
    return number.toString(16).toLowerCase();
};
let ApiKeyCheckerMiddleware = class ApiKeyCheckerMiddleware {
    resolve(...args) {
        return (req, res, next) => {
            if (!req.headers['api-key']) {
                console.log('ApiKeyCheckerMiddleware@resolve: attempt to execute query with no ip key');
                return res.status(common_1.HttpStatus.UNAUTHORIZED).json({ error: 'Wrong API key' });
            }
            const apiKey = req.headers['api-key'];
            const queryData = req.method === 'POST' ? req.body : req.query;
            const phoneNumber = `${queryData.phone_number}` || '';
            let strArray = [];
            Object.keys(queryData).forEach((key) => {
                let data = queryData[key];
                strArray.push(`${key}:${data}`);
            });
            const bodySrc = crc32.bstr(strArray.join(';') + ';');
            const hash = exports.md5(`${req.path}::body::${decimalToHexString(bodySrc)}::key::${env_1.EnvConfig.API_KEY}::phone_number::${phoneNumber}`);
            if (hash !== apiKey.substring(0, apiKey.length - 17)) {
                console.log(`ApiKeyCheckerMiddleware@resolve: attempt to execute query with wrong api key: ${apiKey}`);
                return res.status(common_1.HttpStatus.UNAUTHORIZED).json({ error: 'Wrong API key' });
            }
            next();
        };
    }
};
ApiKeyCheckerMiddleware = __decorate([
    common_1.Middleware()
], ApiKeyCheckerMiddleware);
exports.ApiKeyCheckerMiddleware = ApiKeyCheckerMiddleware;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvbWlkZGxld2FyZS9hcGkua2V5LmNoZWNrZXIubWlkZGxld2FyZS50cyIsInNvdXJjZXMiOlsiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvbWlkZGxld2FyZS9hcGkua2V5LmNoZWNrZXIubWlkZGxld2FyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBLDJDQUF5RjtBQUV6RixnQ0FBZ0M7QUFDaEMsaUNBQWlDO0FBQ2pDLDZDQUE4QztBQUVqQyxRQUFBLEdBQUcsR0FBRyxDQUFDLFFBQWdCLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUVqRyxNQUFNLGtCQUFrQixHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUU7SUFDbEMsRUFBRSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDYixNQUFNLEdBQUcsVUFBVSxHQUFHLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVELE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQzdDLENBQUMsQ0FBQTtBQUdELElBQWEsdUJBQXVCLEdBQXBDO0lBQ0ksT0FBTyxDQUFDLEdBQUcsSUFBVztRQUNsQixNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFO1lBQ3RCLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFCLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEVBQTBFLENBQUMsQ0FBQztnQkFDeEYsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsbUJBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBQyxLQUFLLEVBQUUsZUFBZSxFQUFDLENBQUMsQ0FBQztZQUM5RSxDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN0QyxNQUFNLFNBQVMsR0FBRyxHQUFHLENBQUMsTUFBTSxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztZQUMvRCxNQUFNLFdBQVcsR0FBRyxHQUFHLFNBQVMsQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLENBQUM7WUFDdEQsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDO1lBQ2xCLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7Z0JBQ25DLElBQUksSUFBSSxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDMUIsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ3BDLENBQUMsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1lBQ3JELE1BQU0sSUFBSSxHQUFHLFdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLFdBQVksa0JBQWtCLENBQUMsT0FBTyxDQUFDLFVBQVUsZUFBUyxDQUFDLE9BQU8sbUJBQW1CLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDaEksRUFBRSxDQUFDLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuRCxPQUFPLENBQUMsR0FBRyxDQUFDLGlGQUFpRixNQUFNLEVBQUUsQ0FBQyxDQUFDO2dCQUN2RyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxtQkFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFDLEtBQUssRUFBRSxlQUFlLEVBQUMsQ0FBQyxDQUFDO1lBQzlFLENBQUM7WUFDRCxJQUFJLEVBQUUsQ0FBQztRQUNYLENBQUMsQ0FBQztJQUNOLENBQUM7Q0FDSixDQUFBO0FBekJZLHVCQUF1QjtJQURuQyxtQkFBVSxFQUFFO0dBQ0EsdUJBQXVCLENBeUJuQztBQXpCWSwwREFBdUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge01pZGRsZXdhcmUsIE5lc3RNaWRkbGV3YXJlLCBFeHByZXNzTWlkZGxld2FyZSwgSHR0cFN0YXR1c30gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xuXG5pbXBvcnQgKiBhcyBjcmMzMiBmcm9tICdjcmMtMzInO1xuaW1wb3J0ICogYXMgY3J5cHRvIGZyb20gJ2NyeXB0byc7XG5pbXBvcnQge0VudkNvbmZpZ30gZnJvbSAnLi4vLi4vLi4vY29uZmlnL2Vudic7XG5cbmV4cG9ydCBjb25zdCBtZDUgPSAoY29udGVudHM6IHN0cmluZykgPT4gY3J5cHRvLmNyZWF0ZUhhc2goJ21kNScpLnVwZGF0ZShjb250ZW50cykuZGlnZXN0KCdoZXgnKTtcblxuY29uc3QgZGVjaW1hbFRvSGV4U3RyaW5nID0gKG51bWJlcikgPT4ge1xuICAgIGlmIChudW1iZXIgPCAwKSB7XG4gICAgICAgIG51bWJlciA9IDB4RkZGRkZGRkYgKyBudW1iZXIgKyAxO1xuICAgIH1cblxuICAgIHJldHVybiBudW1iZXIudG9TdHJpbmcoMTYpLnRvTG93ZXJDYXNlKCk7XG59XG5cbkBNaWRkbGV3YXJlKClcbmV4cG9ydCBjbGFzcyBBcGlLZXlDaGVja2VyTWlkZGxld2FyZSBpbXBsZW1lbnRzIE5lc3RNaWRkbGV3YXJlIHtcbiAgICByZXNvbHZlKC4uLmFyZ3M6IGFueVtdKTogRXhwcmVzc01pZGRsZXdhcmUge1xuICAgICAgICByZXR1cm4gKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgICAgICAgICBpZiAoIXJlcS5oZWFkZXJzWydhcGkta2V5J10pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQXBpS2V5Q2hlY2tlck1pZGRsZXdhcmVAcmVzb2x2ZTogYXR0ZW1wdCB0byBleGVjdXRlIHF1ZXJ5IHdpdGggbm8gaXAga2V5Jyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTkFVVEhPUklaRUQpLmpzb24oe2Vycm9yOiAnV3JvbmcgQVBJIGtleSd9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vINCT0LXQvdC10YDQsNGG0LjRjyDQutC70Y7Rh9CwIEFQSSDQuiDRgtC10LrRg9GJ0LXQvNGDINC30LDQv9GA0L7RgdGDXG4gICAgICAgICAgICBjb25zdCBhcGlLZXkgPSByZXEuaGVhZGVyc1snYXBpLWtleSddO1xuICAgICAgICAgICAgY29uc3QgcXVlcnlEYXRhID0gcmVxLm1ldGhvZCA9PT0gJ1BPU1QnID8gcmVxLmJvZHkgOiByZXEucXVlcnk7XG4gICAgICAgICAgICBjb25zdCBwaG9uZU51bWJlciA9IGAke3F1ZXJ5RGF0YS5waG9uZV9udW1iZXJ9YCB8fCAnJztcbiAgICAgICAgICAgIGxldCBzdHJBcnJheSA9IFtdO1xuICAgICAgICAgICAgT2JqZWN0LmtleXMocXVlcnlEYXRhKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgZGF0YSA9IHF1ZXJ5RGF0YVtrZXldO1xuICAgICAgICAgICAgICAgIHN0ckFycmF5LnB1c2goYCR7a2V5fToke2RhdGF9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IGJvZHlTcmMgPSBjcmMzMi5ic3RyKHN0ckFycmF5LmpvaW4oJzsnKSArICc7Jyk7XG4gICAgICAgICAgICBjb25zdCBoYXNoID0gbWQ1KGAke3JlcS5wYXRofTo6Ym9keTo6JHsgZGVjaW1hbFRvSGV4U3RyaW5nKGJvZHlTcmMpfTo6a2V5Ojoke0VudkNvbmZpZy5BUElfS0VZfTo6cGhvbmVfbnVtYmVyOjoke3Bob25lTnVtYmVyfWApO1xuICAgICAgICAgICAgaWYgKGhhc2ggIT09IGFwaUtleS5zdWJzdHJpbmcoMCwgYXBpS2V5Lmxlbmd0aCAtIDE3KSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBBcGlLZXlDaGVja2VyTWlkZGxld2FyZUByZXNvbHZlOiBhdHRlbXB0IHRvIGV4ZWN1dGUgcXVlcnkgd2l0aCB3cm9uZyBhcGkga2V5OiAke2FwaUtleX1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOQVVUSE9SSVpFRCkuanNvbih7ZXJyb3I6ICdXcm9uZyBBUEkga2V5J30pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICB9O1xuICAgIH1cbn0iXX0=