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
            console.log('req.headers[api-key]', req.headers['api-key']);
            const apiKey = req.headers['api-key'];
            const queryData = req.method === 'POST' ? req.body : req.query;
            const phoneNumber = `${queryData.phone_number}` || '';
            console.log('queryData', queryData);
            let strArray = [];
            Object.keys(queryData).forEach((key) => {
                strArray.push(`${key}:${queryData[key]}`);
            });
            console.log('req.path', req.path);
            console.log('strArray', strArray);
            console.log('EnvConfig.API_KEY', env_1.EnvConfig.API_KEY);
            console.log('phoneNumber', phoneNumber);
            console.log('body', strArray.join(';') + ';');
            const bodySrc = crc32.bstr(strArray.join(';') + ';');
            console.log('bodySrc ', decimalToHexString(bodySrc));
            console.log(`${req.path}::body::${decimalToHexString(bodySrc)}::key::${env_1.EnvConfig.API_KEY}::phone_number::${phoneNumber}`);
            const hash = exports.md5(`${req.path}::body::${decimalToHexString(bodySrc)}::key::${env_1.EnvConfig.API_KEY}::phone_number::${phoneNumber}`);
            console.log('hash', hash);
            console.log('отразанная строка', apiKey.substring(0, apiKey.length - 17));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvbWlkZGxld2FyZS9hcGkua2V5LmNoZWNrZXIubWlkZGxld2FyZS50cyIsInNvdXJjZXMiOlsiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvbWlkZGxld2FyZS9hcGkua2V5LmNoZWNrZXIubWlkZGxld2FyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBLDJDQUF5RjtBQUV6RixnQ0FBZ0M7QUFDaEMsaUNBQWlDO0FBQ2pDLDZDQUE4QztBQUVqQyxRQUFBLEdBQUcsR0FBRyxDQUFDLFFBQWdCLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUVqRyxNQUFNLGtCQUFrQixHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUU7SUFDbEMsRUFBRSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDYixNQUFNLEdBQUcsVUFBVSxHQUFHLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVELE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQzdDLENBQUMsQ0FBQTtBQUdELElBQWEsdUJBQXVCLEdBQXBDO0lBQ0ksT0FBTyxDQUFDLEdBQUcsSUFBVztRQUNsQixNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFO1lBQ3RCLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFCLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEVB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LEtBQUssRUFBRSxlQUFlLEVBQUMsQ0FBQyxDQUFDO1lBQzlFLENBQUM7WUFDRCxJQUFJLEVBQUUsQ0FBQztRQUNYLENBQUMsQ0FBQztJQUNOLENBQUM7Q0FDSixDQUFBO0FBcENZLHVCQUF1QjtJQURuQyxtQkFBVSxFQUFFO0dBQ0EsdUJBQXVCLENBb0NuQztBQXBDWSwwREFBdUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge01pZGRsZXdhcmUsIE5lc3RNaWRkbGV3YXJlLCBFeHByZXNzTWlkZGxld2FyZSwgSHR0cFN0YXR1c30gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xuXG5pbXBvcnQgKiBhcyBjcmMzMiBmcm9tICdjcmMtMzInO1xuaW1wb3J0ICogYXMgY3J5cHRvIGZyb20gJ2NyeXB0byc7XG5pbXBvcnQge0VudkNvbmZpZ30gZnJvbSAnLi4vLi4vLi4vY29uZmlnL2Vudic7XG5cbmV4cG9ydCBjb25zdCBtZDUgPSAoY29udGVudHM6IHN0cmluZykgPT4gY3J5cHRvLmNyZWF0ZUhhc2goJ21kNScpLnVwZGF0ZShjb250ZW50cykuZGlnZXN0KCdoZXgnKTtcblxuY29uc3QgZGVjaW1hbFRvSGV4U3RyaW5nID0gKG51bWJlcikgPT57XG4gICAgaWYgKG51bWJlciA8IDApIHtcbiAgICAgICAgbnVtYmVyID0gMHhGRkZGRkZGRiArIG51bWJlciArIDE7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bWJlci50b1N0cmluZygxNikudG9Mb3dlckNhc2UoKTtcbn1cblxuQE1pZGRsZXdhcmUoKVxuZXhwb3J0IGNsYXNzIEFwaUtleUNoZWNrZXJNaWRkbGV3YXJlIGltcGxlbWVudHMgTmVzdE1pZGRsZXdhcmUge1xuICAgIHJlc29sdmUoLi4uYXJnczogYW55W10pOiBFeHByZXNzTWlkZGxld2FyZSB7XG4gICAgICAgIHJldHVybiAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAgICAgICAgIGlmICghcmVxLmhlYWRlcnNbJ2FwaS1rZXknXSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBcGlLZXlDaGVja2VyTWlkZGxld2FyZUByZXNvbHZlOiBhdHRlbXB0IHRvIGV4ZWN1dGUgcXVlcnkgd2l0aCBubyBpcCBrZXknKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOQVVUSE9SSVpFRCkuanNvbih7ZXJyb3I6ICdXcm9uZyBBUEkga2V5J30pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3JlcS5oZWFkZXJzW2FwaS1rZXldJywgcmVxLmhlYWRlcnNbJ2FwaS1rZXknXSk7XG4gICAgICAgICAgICAvLyDQk9C10L3QtdGA0LDRhtC40Y8g0LrQu9GO0YfQsCBBUEkg0Log0YLQtdC60YPRidC10LzRgyDQt9Cw0L/RgNC+0YHRg1xuICAgICAgICAgICAgY29uc3QgYXBpS2V5ID0gcmVxLmhlYWRlcnNbJ2FwaS1rZXknXTtcbiAgICAgICAgICAgIGNvbnN0IHF1ZXJ5RGF0YSA9IHJlcS5tZXRob2QgPT09ICdQT1NUJyA/IHJlcS5ib2R5IDogcmVxLnF1ZXJ5O1xuICAgICAgICAgICAgY29uc3QgcGhvbmVOdW1iZXIgPSBgJHtxdWVyeURhdGEucGhvbmVfbnVtYmVyfWAgfHwgJyc7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygncXVlcnlEYXRhJywgcXVlcnlEYXRhKTtcbiAgICAgICAgICAgIGxldCBzdHJBcnJheSA9IFtdO1xuICAgICAgICAgICAgT2JqZWN0LmtleXMocXVlcnlEYXRhKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgICAgICBzdHJBcnJheS5wdXNoKGAke2tleX06JHtxdWVyeURhdGFba2V5XX1gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3JlcS5wYXRoJywgcmVxLnBhdGgpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3N0ckFycmF5Jywgc3RyQXJyYXkpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0VudkNvbmZpZy5BUElfS0VZJywgRW52Q29uZmlnLkFQSV9LRVkpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3Bob25lTnVtYmVyJywgcGhvbmVOdW1iZXIpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2JvZHknLCBzdHJBcnJheS5qb2luKCc7JykrJzsnKTtcblxuICAgICAgICAgICAgY29uc3QgYm9keVNyYyA9IGNyYzMyLmJzdHIoc3RyQXJyYXkuam9pbignOycpKyc7Jyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnYm9keVNyYyAnLCBkZWNpbWFsVG9IZXhTdHJpbmcoYm9keVNyYykpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCR7cmVxLnBhdGh9Ojpib2R5OjokeyBkZWNpbWFsVG9IZXhTdHJpbmcoYm9keVNyYyl9OjprZXk6OiR7RW52Q29uZmlnLkFQSV9LRVl9OjpwaG9uZV9udW1iZXI6OiR7cGhvbmVOdW1iZXJ9YCk7XG4gICAgICAgICAgICBjb25zdCBoYXNoID0gbWQ1KGAke3JlcS5wYXRofTo6Ym9keTo6JHsgZGVjaW1hbFRvSGV4U3RyaW5nKGJvZHlTcmMpfTo6a2V5Ojoke0VudkNvbmZpZy5BUElfS0VZfTo6cGhvbmVfbnVtYmVyOjoke3Bob25lTnVtYmVyfWApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2hhc2gnLCBoYXNoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCfQvtGC0YDQsNC30LDQvdC90LDRjyDRgdGC0YDQvtC60LAnLGFwaUtleS5zdWJzdHJpbmcoMCwgYXBpS2V5Lmxlbmd0aCAtIDE3KSApO1xuICAgICAgICAgICAgaWYgKGhhc2ggIT09IGFwaUtleS5zdWJzdHJpbmcoMCwgYXBpS2V5Lmxlbmd0aCAtIDE3KSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBBcGlLZXlDaGVja2VyTWlkZGxld2FyZUByZXNvbHZlOiBhdHRlbXB0IHRvIGV4ZWN1dGUgcXVlcnkgd2l0aCB3cm9uZyBhcGkga2V5OiAke2FwaUtleX1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOQVVUSE9SSVpFRCkuanNvbih7ZXJyb3I6ICdXcm9uZyBBUEkga2V5J30pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICB9O1xuICAgIH1cbn0iXX0=