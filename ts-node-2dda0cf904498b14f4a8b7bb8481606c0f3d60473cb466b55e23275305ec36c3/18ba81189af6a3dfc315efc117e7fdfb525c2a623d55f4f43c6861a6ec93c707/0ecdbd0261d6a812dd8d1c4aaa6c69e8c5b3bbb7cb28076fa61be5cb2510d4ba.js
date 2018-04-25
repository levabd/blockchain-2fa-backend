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
const env_1 = require("../../../config/env");
const helpers_1 = require("../../../services/helpers/helpers");
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
            const hash = helpers_1.md5(`${req.path}::body::${helpers_1.decimalToHexString(bodySrc)}::key::${env_1.EnvConfig.API_KEY}::phone_number::${phoneNumber}`);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvbWlkZGxld2FyZS9hcGkua2V5LmNoZWNrZXIubWlkZGxld2FyZS50cyIsInNvdXJjZXMiOlsiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvbWlkZGxld2FyZS9hcGkua2V5LmNoZWNrZXIubWlkZGxld2FyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBLDJDQUF5RjtBQUN6RixnQ0FBZ0M7QUFDaEMsNkNBQThDO0FBQzlDLCtEQUEwRTtBQUcxRSxJQUFhLHVCQUF1QixHQUFwQztJQUNJLE9BQU8sQ0FBQyxHQUFHLElBQVc7UUFDbEIsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUN0QixFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixPQUFPLENBQUMsR0FBRyxDQUFDLDBFQUEwRSxDQUFDLENBQUM7Z0JBQ3hGLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLG1CQUFVLENBQUMsWUFBWSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUMsS0FBSyxFQUFFLGVBQWUsRUFBQyxDQUFDLENBQUM7WUFDOUUsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDdEMsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLE1BQU0sS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUM7WUFDL0QsTUFBTSxXQUFXLEdBQUcsR0FBRyxTQUFTLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxDQUFDO1lBQ3RELElBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQztZQUNsQixNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO2dCQUNuQyxJQUFJLElBQUksR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzFCLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNwQyxDQUFDLENBQUMsQ0FBQztZQUNILE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztZQUNyRCxNQUFNLElBQUksR0FBRyxhQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxXQUFZLDRCQUFrQixDQUFDLE9BQU8sQ0FBQyxVQUFVLGVBQVMsQ0FBQyxPQUFPLG1CQUFtQixXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQ2hJLEVBQUUsQ0FBQyxDQUFDLElBQUksS0FBSyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpRkFBaUYsTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFDdkcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsbUJBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBQyxLQUFLLEVBQUUsZUFBZSxFQUFDLENBQUMsQ0FBQztZQUM5RSxDQUFDO1lBQ0QsSUFBSSxFQUFFLENBQUM7UUFDWCxDQUFDLENBQUM7SUFDTixDQUFDO0NBQ0osQ0FBQTtBQXpCWSx1QkFBdUI7SUFEbkMsbUJBQVUsRUFBRTtHQUNBLHVCQUF1QixDQXlCbkM7QUF6QlksMERBQXVCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtNaWRkbGV3YXJlLCBOZXN0TWlkZGxld2FyZSwgRXhwcmVzc01pZGRsZXdhcmUsIEh0dHBTdGF0dXN9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcbmltcG9ydCAqIGFzIGNyYzMyIGZyb20gJ2NyYy0zMic7XG5pbXBvcnQge0VudkNvbmZpZ30gZnJvbSAnLi4vLi4vLi4vY29uZmlnL2Vudic7XG5pbXBvcnQge2RlY2ltYWxUb0hleFN0cmluZywgbWQ1fSBmcm9tICcuLi8uLi8uLi9zZXJ2aWNlcy9oZWxwZXJzL2hlbHBlcnMnO1xuXG5ATWlkZGxld2FyZSgpXG5leHBvcnQgY2xhc3MgQXBpS2V5Q2hlY2tlck1pZGRsZXdhcmUgaW1wbGVtZW50cyBOZXN0TWlkZGxld2FyZSB7XG4gICAgcmVzb2x2ZSguLi5hcmdzOiBhbnlbXSk6IEV4cHJlc3NNaWRkbGV3YXJlIHtcbiAgICAgICAgcmV0dXJuIChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFyZXEuaGVhZGVyc1snYXBpLWtleSddKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0FwaUtleUNoZWNrZXJNaWRkbGV3YXJlQHJlc29sdmU6IGF0dGVtcHQgdG8gZXhlY3V0ZSBxdWVyeSB3aXRoIG5vIGlwIGtleScpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5BVVRIT1JJWkVEKS5qc29uKHtlcnJvcjogJ1dyb25nIEFQSSBrZXknfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDQk9C10L3QtdGA0LDRhtC40Y8g0LrQu9GO0YfQsCBBUEkg0Log0YLQtdC60YPRidC10LzRgyDQt9Cw0L/RgNC+0YHRg1xuICAgICAgICAgICAgY29uc3QgYXBpS2V5ID0gcmVxLmhlYWRlcnNbJ2FwaS1rZXknXTtcbiAgICAgICAgICAgIGNvbnN0IHF1ZXJ5RGF0YSA9IHJlcS5tZXRob2QgPT09ICdQT1NUJyA/IHJlcS5ib2R5IDogcmVxLnF1ZXJ5O1xuICAgICAgICAgICAgY29uc3QgcGhvbmVOdW1iZXIgPSBgJHtxdWVyeURhdGEucGhvbmVfbnVtYmVyfWAgfHwgJyc7XG4gICAgICAgICAgICBsZXQgc3RyQXJyYXkgPSBbXTtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKHF1ZXJ5RGF0YSkuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGRhdGEgPSBxdWVyeURhdGFba2V5XTtcbiAgICAgICAgICAgICAgICBzdHJBcnJheS5wdXNoKGAke2tleX06JHtkYXRhfWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBib2R5U3JjID0gY3JjMzIuYnN0cihzdHJBcnJheS5qb2luKCc7JykgKyAnOycpO1xuICAgICAgICAgICAgY29uc3QgaGFzaCA9IG1kNShgJHtyZXEucGF0aH06OmJvZHk6OiR7IGRlY2ltYWxUb0hleFN0cmluZyhib2R5U3JjKX06OmtleTo6JHtFbnZDb25maWcuQVBJX0tFWX06OnBob25lX251bWJlcjo6JHtwaG9uZU51bWJlcn1gKTtcbiAgICAgICAgICAgIGlmIChoYXNoICE9PSBhcGlLZXkuc3Vic3RyaW5nKDAsIGFwaUtleS5sZW5ndGggLSAxNykpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgQXBpS2V5Q2hlY2tlck1pZGRsZXdhcmVAcmVzb2x2ZTogYXR0ZW1wdCB0byBleGVjdXRlIHF1ZXJ5IHdpdGggd3JvbmcgYXBpIGtleTogJHthcGlLZXl9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTkFVVEhPUklaRUQpLmpzb24oe2Vycm9yOiAnV3JvbmcgQVBJIGtleSd9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgfTtcbiAgICB9XG59Il19