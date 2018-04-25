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
let FrontendApiKeyCheckerMiddleware = class FrontendApiKeyCheckerMiddleware {
    resolve(...args) {
        return (req, res, next) => {
            if (!req.headers['api-key']) {
                console.log('FrontendApiKeyCheckerMiddleware@resolve: attempt to execute query with no ip key');
                return res.status(common_1.HttpStatus.UNAUTHORIZED).json({ error: 'Wrong API key' });
            }
            const apiKey = req.headers['api-key'];
            const queryData = req.method === 'POST' ? req.body : req.query;
            const phoneNumber = `${queryData.phone_number}` || '';
            let strArray = [];
            Object.keys(queryData).forEach((key) => {
                strArray.push(`${key}:${queryData[key]}`);
            });
            const bodySrc = crc32.bstr(strArray.join(';') + ';');
            const hash = exports.md5(`${req.path}::body::${decimalToHexString(bodySrc)}::key::${env_1.EnvConfig.API_KEY_FRONTEND}::phone_number::${phoneNumber}`);
            if (hash !== apiKey.substring(0, apiKey.length - 17)) {
                console.log(`FrontendApiKeyCheckerMiddleware@resolve: attempt to execute query with wrong api key: ${apiKey}`);
                return res.status(common_1.HttpStatus.UNAUTHORIZED).json({ error: 'Wrong API key' });
            }
            next();
        };
    }
};
FrontendApiKeyCheckerMiddleware = __decorate([
    common_1.Middleware()
], FrontendApiKeyCheckerMiddleware);
exports.FrontendApiKeyCheckerMiddleware = FrontendApiKeyCheckerMiddleware;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvbWlkZGxld2FyZS9mcm9udGVuZC5hcGkua2V5LmNoZWNrZXIubWlkZGxld2FyZS50cyIsInNvdXJjZXMiOlsiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvbWlkZGxld2FyZS9mcm9udGVuZC5hcGkua2V5LmNoZWNrZXIubWlkZGxld2FyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBLDJDQUF5RjtBQUV6RixnQ0FBZ0M7QUFDaEMsaUNBQWlDO0FBQ2pDLDZDQUE4QztBQUVqQyxRQUFBLEdBQUcsR0FBRyxDQUFDLFFBQWdCLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUVqRyxNQUFNLGtCQUFrQixHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUU7SUFDbEMsRUFBRSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDYixNQUFNLEdBQUcsVUFBVSxHQUFHLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVELE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQzdDLENBQUMsQ0FBQTtBQUdELElBQWEsK0JBQStCLEdBQTVDO0lBQ0ksT0FBTyxDQUFDLEdBQUcsSUFBVztRQUNsQixNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFO1lBQ3RCLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFCLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0ZBQWtGLENBQUMsQ0FBQztnQkFDaEcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsbUJBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBQyxLQUFLLEVBQUUsZUFBZSxFQUFDLENBQUMsQ0FBQztZQUM5RSxDQUFDO1lBR0QsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN0QyxNQUFNLFNBQVMsR0FBRyxHQUFHLENBQUMsTUFBTSxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztZQUMvRCxNQUFNLFdBQVcsR0FBRyxHQUFHLFNBQVMsQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLENBQUM7WUFFdEQsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDO1lBQ2xCLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7Z0JBQ25DLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM5QyxDQUFDLENBQUMsQ0FBQztZQU9ILE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBQyxHQUFHLENBQUMsQ0FBQztZQUduRCxNQUFNLElBQUksR0FBRyxXQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxXQUFZLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxVQUFVLGVBQVMsQ0FBQyxnQkFBZ0IsbUJBQW1CLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFHekksRUFBRSxDQUFDLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuRCxPQUFPLENBQUMsR0FBRyxDQUFDLHlGQUF5RixNQUFNLEVBQUUsQ0FBQyxDQUFDO2dCQUMvRyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxtQkFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFDLEtBQUssRUFBRSxlQUFlLEVBQUMsQ0FBQyxDQUFDO1lBQzlFLENBQUM7WUFDRCxJQUFJLEVBQUUsQ0FBQztRQUNYLENBQUMsQ0FBQztJQUNOLENBQUM7Q0FDSixDQUFBO0FBcENZLCtCQUErQjtJQUQzQyxtQkFBVSxFQUFFO0dBQ0EsK0JBQStCLENBb0MzQztBQXBDWSwwRUFBK0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge01pZGRsZXdhcmUsIE5lc3RNaWRkbGV3YXJlLCBFeHByZXNzTWlkZGxld2FyZSwgSHR0cFN0YXR1c30gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xuXG5pbXBvcnQgKiBhcyBjcmMzMiBmcm9tICdjcmMtMzInO1xuaW1wb3J0ICogYXMgY3J5cHRvIGZyb20gJ2NyeXB0byc7XG5pbXBvcnQge0VudkNvbmZpZ30gZnJvbSAnLi4vLi4vLi4vY29uZmlnL2Vudic7XG5cbmV4cG9ydCBjb25zdCBtZDUgPSAoY29udGVudHM6IHN0cmluZykgPT4gY3J5cHRvLmNyZWF0ZUhhc2goJ21kNScpLnVwZGF0ZShjb250ZW50cykuZGlnZXN0KCdoZXgnKTtcblxuY29uc3QgZGVjaW1hbFRvSGV4U3RyaW5nID0gKG51bWJlcikgPT4ge1xuICAgIGlmIChudW1iZXIgPCAwKSB7XG4gICAgICAgIG51bWJlciA9IDB4RkZGRkZGRkYgKyBudW1iZXIgKyAxO1xuICAgIH1cblxuICAgIHJldHVybiBudW1iZXIudG9TdHJpbmcoMTYpLnRvTG93ZXJDYXNlKCk7XG59XG5cbkBNaWRkbGV3YXJlKClcbmV4cG9ydCBjbGFzcyBGcm9udGVuZEFwaUtleUNoZWNrZXJNaWRkbGV3YXJlIGltcGxlbWVudHMgTmVzdE1pZGRsZXdhcmUge1xuICAgIHJlc29sdmUoLi4uYXJnczogYW55W10pOiBFeHByZXNzTWlkZGxld2FyZSB7XG4gICAgICAgIHJldHVybiAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAgICAgICAgIGlmICghcmVxLmhlYWRlcnNbJ2FwaS1rZXknXSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdGcm9udGVuZEFwaUtleUNoZWNrZXJNaWRkbGV3YXJlQHJlc29sdmU6IGF0dGVtcHQgdG8gZXhlY3V0ZSBxdWVyeSB3aXRoIG5vIGlwIGtleScpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5BVVRIT1JJWkVEKS5qc29uKHtlcnJvcjogJ1dyb25nIEFQSSBrZXknfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygncmVxLmhlYWRlcnNbYXBpLWtleV0nLCByZXEuaGVhZGVyc1snYXBpLWtleSddKTtcbiAgICAgICAgICAgIC8vINCT0LXQvdC10YDQsNGG0LjRjyDQutC70Y7Rh9CwIEFQSSDQuiDRgtC10LrRg9GJ0LXQvNGDINC30LDQv9GA0L7RgdGDXG4gICAgICAgICAgICBjb25zdCBhcGlLZXkgPSByZXEuaGVhZGVyc1snYXBpLWtleSddO1xuICAgICAgICAgICAgY29uc3QgcXVlcnlEYXRhID0gcmVxLm1ldGhvZCA9PT0gJ1BPU1QnID8gcmVxLmJvZHkgOiByZXEucXVlcnk7XG4gICAgICAgICAgICBjb25zdCBwaG9uZU51bWJlciA9IGAke3F1ZXJ5RGF0YS5waG9uZV9udW1iZXJ9YCB8fCAnJztcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdxdWVyeURhdGEnLCBxdWVyeURhdGEpO1xuICAgICAgICAgICAgbGV0IHN0ckFycmF5ID0gW107XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhxdWVyeURhdGEpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgICAgIHN0ckFycmF5LnB1c2goYCR7a2V5fToke3F1ZXJ5RGF0YVtrZXldfWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygncmVxLnBhdGgnLCByZXEucGF0aCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnc3RyQXJyYXknLCBzdHJBcnJheSk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnRW52Q29uZmlnLkFQSV9LRVknLCBFbnZDb25maWcuQVBJX0tFWV9GUk9OVEVORCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygncGhvbmVOdW1iZXInLCBwaG9uZU51bWJlcik7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnYm9keScsIHN0ckFycmF5LmpvaW4oJzsnKSsnOycpO1xuXG4gICAgICAgICAgICBjb25zdCBib2R5U3JjID0gY3JjMzIuYnN0cihzdHJBcnJheS5qb2luKCc7JykrJzsnKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdib2R5U3JjICcsIGRlY2ltYWxUb0hleFN0cmluZyhib2R5U3JjKSk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgJHtyZXEucGF0aH06OmJvZHk6OiR7IGRlY2ltYWxUb0hleFN0cmluZyhib2R5U3JjKX06OmtleTo6JHtFbnZDb25maWcuQVBJX0tFWV9GUk9OVEVORH06OnBob25lX251bWJlcjo6JHtwaG9uZU51bWJlcn1gKTtcbiAgICAgICAgICAgIGNvbnN0IGhhc2ggPSBtZDUoYCR7cmVxLnBhdGh9Ojpib2R5OjokeyBkZWNpbWFsVG9IZXhTdHJpbmcoYm9keVNyYyl9OjprZXk6OiR7RW52Q29uZmlnLkFQSV9LRVlfRlJPTlRFTkR9OjpwaG9uZV9udW1iZXI6OiR7cGhvbmVOdW1iZXJ9YCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnaGFzaCcsIGhhc2gpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ9C+0YLRgNCw0LfQsNC90L3QsNGPINGB0YLRgNC+0LrQsCcsYXBpS2V5LnN1YnN0cmluZygwLCBhcGlLZXkubGVuZ3RoIC0gMTcpICk7XG4gICAgICAgICAgICBpZiAoaGFzaCAhPT0gYXBpS2V5LnN1YnN0cmluZygwLCBhcGlLZXkubGVuZ3RoIC0gMTcpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYEZyb250ZW5kQXBpS2V5Q2hlY2tlck1pZGRsZXdhcmVAcmVzb2x2ZTogYXR0ZW1wdCB0byBleGVjdXRlIHF1ZXJ5IHdpdGggd3JvbmcgYXBpIGtleTogJHthcGlLZXl9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTkFVVEhPUklaRUQpLmpzb24oe2Vycm9yOiAnV3JvbmcgQVBJIGtleSd9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgfTtcbiAgICB9XG59Il19