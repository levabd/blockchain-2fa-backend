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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvbWlkZGxld2FyZS9mcm9udGVuZC5hcGkua2V5LmNoZWNrZXIubWlkZGxld2FyZS50cyIsInNvdXJjZXMiOlsiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvbWlkZGxld2FyZS9mcm9udGVuZC5hcGkua2V5LmNoZWNrZXIubWlkZGxld2FyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBLDJDQUF5RjtBQUV6RixnQ0FBZ0M7QUFDaEMsaUNBQWlDO0FBQ2pDLDZDQUE4QztBQUVqQyxRQUFBLEdBQUcsR0FBRyxDQUFDLFFBQWdCLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUVqRyxNQUFNLGtCQUFrQixHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUU7SUFDbEMsRUFBRSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDYixNQUFNLEdBQUcsVUFBVSxHQUFHLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVELE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQzdDLENBQUMsQ0FBQTtBQUdELElBQWEsK0JBQStCLEdBQTVDO0lBQ0ksT0FBTyxDQUFDLEdBQUcsSUFBVztRQUNsQixNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFO1lBQ3RCLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFCLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0ZBQWtGLENBQUMsQ0FBQztnQkFDaEcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsbUJBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBQyxLQUFLLEVBQUUsZUFBZSxFQUFDLENBQUMsQ0FBQztZQUM5RSxDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN0QyxNQUFNLFNBQVMsR0FBRyxHQUFHLENBQUMsTUFBTSxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztZQUMvRCxNQUFNLFdBQVcsR0FBRyxHQUFHLFNBQVMsQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLENBQUM7WUFDdEQsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDO1lBQ2xCLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7Z0JBQ25DLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM5QyxDQUFDLENBQUMsQ0FBQztZQUNILE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBQyxHQUFHLENBQUMsQ0FBQztZQUNuRCxNQUFNLElBQUksR0FBRyxXQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxXQUFZLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxVQUFVLGVBQVMsQ0FBQyxnQkFBZ0IsbUJBQW1CLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDekksRUFBRSxDQUFDLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuRCxPQUFPLENBQUMsR0FBRyxDQUFDLHlGQUF5RixNQUFNLEVBQUUsQ0FBQyxDQUFDO2dCQUMvRyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxtQkFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFDLEtBQUssRUFBRSxlQUFlLEVBQUMsQ0FBQyxDQUFDO1lBQzlFLENBQUM7WUFDRCxJQUFJLEVBQUUsQ0FBQztRQUNYLENBQUMsQ0FBQztJQUNOLENBQUM7Q0FDSixDQUFBO0FBeEJZLCtCQUErQjtJQUQzQyxtQkFBVSxFQUFFO0dBQ0EsK0JBQStCLENBd0IzQztBQXhCWSwwRUFBK0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge01pZGRsZXdhcmUsIE5lc3RNaWRkbGV3YXJlLCBFeHByZXNzTWlkZGxld2FyZSwgSHR0cFN0YXR1c30gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xuXG5pbXBvcnQgKiBhcyBjcmMzMiBmcm9tICdjcmMtMzInO1xuaW1wb3J0ICogYXMgY3J5cHRvIGZyb20gJ2NyeXB0byc7XG5pbXBvcnQge0VudkNvbmZpZ30gZnJvbSAnLi4vLi4vLi4vY29uZmlnL2Vudic7XG5cbmV4cG9ydCBjb25zdCBtZDUgPSAoY29udGVudHM6IHN0cmluZykgPT4gY3J5cHRvLmNyZWF0ZUhhc2goJ21kNScpLnVwZGF0ZShjb250ZW50cykuZGlnZXN0KCdoZXgnKTtcblxuY29uc3QgZGVjaW1hbFRvSGV4U3RyaW5nID0gKG51bWJlcikgPT4ge1xuICAgIGlmIChudW1iZXIgPCAwKSB7XG4gICAgICAgIG51bWJlciA9IDB4RkZGRkZGRkYgKyBudW1iZXIgKyAxO1xuICAgIH1cblxuICAgIHJldHVybiBudW1iZXIudG9TdHJpbmcoMTYpLnRvTG93ZXJDYXNlKCk7XG59XG5cbkBNaWRkbGV3YXJlKClcbmV4cG9ydCBjbGFzcyBGcm9udGVuZEFwaUtleUNoZWNrZXJNaWRkbGV3YXJlIGltcGxlbWVudHMgTmVzdE1pZGRsZXdhcmUge1xuICAgIHJlc29sdmUoLi4uYXJnczogYW55W10pOiBFeHByZXNzTWlkZGxld2FyZSB7XG4gICAgICAgIHJldHVybiAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAgICAgICAgIGlmICghcmVxLmhlYWRlcnNbJ2FwaS1rZXknXSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdGcm9udGVuZEFwaUtleUNoZWNrZXJNaWRkbGV3YXJlQHJlc29sdmU6IGF0dGVtcHQgdG8gZXhlY3V0ZSBxdWVyeSB3aXRoIG5vIGlwIGtleScpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5BVVRIT1JJWkVEKS5qc29uKHtlcnJvcjogJ1dyb25nIEFQSSBrZXknfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDQk9C10L3QtdGA0LDRhtC40Y8g0LrQu9GO0YfQsCBBUEkg0Log0YLQtdC60YPRidC10LzRgyDQt9Cw0L/RgNC+0YHRg1xuICAgICAgICAgICAgY29uc3QgYXBpS2V5ID0gcmVxLmhlYWRlcnNbJ2FwaS1rZXknXTtcbiAgICAgICAgICAgIGNvbnN0IHF1ZXJ5RGF0YSA9IHJlcS5tZXRob2QgPT09ICdQT1NUJyA/IHJlcS5ib2R5IDogcmVxLnF1ZXJ5O1xuICAgICAgICAgICAgY29uc3QgcGhvbmVOdW1iZXIgPSBgJHtxdWVyeURhdGEucGhvbmVfbnVtYmVyfWAgfHwgJyc7XG4gICAgICAgICAgICBsZXQgc3RyQXJyYXkgPSBbXTtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKHF1ZXJ5RGF0YSkuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgc3RyQXJyYXkucHVzaChgJHtrZXl9OiR7cXVlcnlEYXRhW2tleV19YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IGJvZHlTcmMgPSBjcmMzMi5ic3RyKHN0ckFycmF5LmpvaW4oJzsnKSsnOycpO1xuICAgICAgICAgICAgY29uc3QgaGFzaCA9IG1kNShgJHtyZXEucGF0aH06OmJvZHk6OiR7IGRlY2ltYWxUb0hleFN0cmluZyhib2R5U3JjKX06OmtleTo6JHtFbnZDb25maWcuQVBJX0tFWV9GUk9OVEVORH06OnBob25lX251bWJlcjo6JHtwaG9uZU51bWJlcn1gKTtcbiAgICAgICAgICAgIGlmIChoYXNoICE9PSBhcGlLZXkuc3Vic3RyaW5nKDAsIGFwaUtleS5sZW5ndGggLSAxNykpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgRnJvbnRlbmRBcGlLZXlDaGVja2VyTWlkZGxld2FyZUByZXNvbHZlOiBhdHRlbXB0IHRvIGV4ZWN1dGUgcXVlcnkgd2l0aCB3cm9uZyBhcGkga2V5OiAke2FwaUtleX1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOQVVUSE9SSVpFRCkuanNvbih7ZXJyb3I6ICdXcm9uZyBBUEkga2V5J30pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICB9O1xuICAgIH1cbn0iXX0=