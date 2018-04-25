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
            const hash = helpers_1.md5(`${req.path}::body::${helpers_1.decimalToHexString(bodySrc)}::key::${env_1.EnvConfig.API_KEY_FRONTEND}::phone_number::${phoneNumber}`);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvbWlkZGxld2FyZS9mcm9udGVuZC5hcGkua2V5LmNoZWNrZXIubWlkZGxld2FyZS50cyIsInNvdXJjZXMiOlsiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvbWlkZGxld2FyZS9mcm9udGVuZC5hcGkua2V5LmNoZWNrZXIubWlkZGxld2FyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBLDJDQUF5RjtBQUN6RixnQ0FBZ0M7QUFDaEMsNkNBQThDO0FBQzlDLCtEQUEwRTtBQUcxRSxJQUFhLCtCQUErQixHQUE1QztJQUNJLE9BQU8sQ0FBQyxHQUFHLElBQVc7UUFDbEIsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUN0QixFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixPQUFPLENBQUMsR0FBRyxDQUFDLGtGQUFrRixDQUFDLENBQUM7Z0JBQ2hHLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLG1CQUFVLENBQUMsWUFBWSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUMsS0FBSyxFQUFFLGVBQWUsRUFBQyxDQUFDLENBQUM7WUFDOUUsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDdEMsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLE1BQU0sS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUM7WUFDL0QsTUFBTSxXQUFXLEdBQUcsR0FBRyxTQUFTLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxDQUFDO1lBQ3RELElBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQztZQUNsQixNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO2dCQUNuQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDOUMsQ0FBQyxDQUFDLENBQUM7WUFDSCxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUMsR0FBRyxDQUFDLENBQUM7WUFDbkQsTUFBTSxJQUFJLEdBQUcsYUFBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksV0FBWSw0QkFBa0IsQ0FBQyxPQUFPLENBQUMsVUFBVSxlQUFTLENBQUMsZ0JBQWdCLG1CQUFtQixXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQ3pJLEVBQUUsQ0FBQyxDQUFDLElBQUksS0FBSyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkQsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5RkFBeUYsTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFDL0csTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsbUJBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBQyxLQUFLLEVBQUUsZUFBZSxFQUFDLENBQUMsQ0FBQztZQUM5RSxDQUFDO1lBQ0QsSUFBSSxFQUFFLENBQUM7UUFDWCxDQUFDLENBQUM7SUFDTixDQUFDO0NBQ0osQ0FBQTtBQXhCWSwrQkFBK0I7SUFEM0MsbUJBQVUsRUFBRTtHQUNBLCtCQUErQixDQXdCM0M7QUF4QlksMEVBQStCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtNaWRkbGV3YXJlLCBOZXN0TWlkZGxld2FyZSwgRXhwcmVzc01pZGRsZXdhcmUsIEh0dHBTdGF0dXN9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcbmltcG9ydCAqIGFzIGNyYzMyIGZyb20gJ2NyYy0zMic7XG5pbXBvcnQge0VudkNvbmZpZ30gZnJvbSAnLi4vLi4vLi4vY29uZmlnL2Vudic7XG5pbXBvcnQge2RlY2ltYWxUb0hleFN0cmluZywgbWQ1fSBmcm9tICcuLi8uLi8uLi9zZXJ2aWNlcy9oZWxwZXJzL2hlbHBlcnMnO1xuXG5ATWlkZGxld2FyZSgpXG5leHBvcnQgY2xhc3MgRnJvbnRlbmRBcGlLZXlDaGVja2VyTWlkZGxld2FyZSBpbXBsZW1lbnRzIE5lc3RNaWRkbGV3YXJlIHtcbiAgICByZXNvbHZlKC4uLmFyZ3M6IGFueVtdKTogRXhwcmVzc01pZGRsZXdhcmUge1xuICAgICAgICByZXR1cm4gKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgICAgICAgICBpZiAoIXJlcS5oZWFkZXJzWydhcGkta2V5J10pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRnJvbnRlbmRBcGlLZXlDaGVja2VyTWlkZGxld2FyZUByZXNvbHZlOiBhdHRlbXB0IHRvIGV4ZWN1dGUgcXVlcnkgd2l0aCBubyBpcCBrZXknKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOQVVUSE9SSVpFRCkuanNvbih7ZXJyb3I6ICdXcm9uZyBBUEkga2V5J30pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g0JPQtdC90LXRgNCw0YbQuNGPINC60LvRjtGH0LAgQVBJINC6INGC0LXQutGD0YnQtdC80YMg0LfQsNC/0YDQvtGB0YNcbiAgICAgICAgICAgIGNvbnN0IGFwaUtleSA9IHJlcS5oZWFkZXJzWydhcGkta2V5J107XG4gICAgICAgICAgICBjb25zdCBxdWVyeURhdGEgPSByZXEubWV0aG9kID09PSAnUE9TVCcgPyByZXEuYm9keSA6IHJlcS5xdWVyeTtcbiAgICAgICAgICAgIGNvbnN0IHBob25lTnVtYmVyID0gYCR7cXVlcnlEYXRhLnBob25lX251bWJlcn1gIHx8ICcnO1xuICAgICAgICAgICAgbGV0IHN0ckFycmF5ID0gW107XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhxdWVyeURhdGEpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgICAgIHN0ckFycmF5LnB1c2goYCR7a2V5fToke3F1ZXJ5RGF0YVtrZXldfWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBib2R5U3JjID0gY3JjMzIuYnN0cihzdHJBcnJheS5qb2luKCc7JykrJzsnKTtcbiAgICAgICAgICAgIGNvbnN0IGhhc2ggPSBtZDUoYCR7cmVxLnBhdGh9Ojpib2R5OjokeyBkZWNpbWFsVG9IZXhTdHJpbmcoYm9keVNyYyl9OjprZXk6OiR7RW52Q29uZmlnLkFQSV9LRVlfRlJPTlRFTkR9OjpwaG9uZV9udW1iZXI6OiR7cGhvbmVOdW1iZXJ9YCk7XG4gICAgICAgICAgICBpZiAoaGFzaCAhPT0gYXBpS2V5LnN1YnN0cmluZygwLCBhcGlLZXkubGVuZ3RoIC0gMTcpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYEZyb250ZW5kQXBpS2V5Q2hlY2tlck1pZGRsZXdhcmVAcmVzb2x2ZTogYXR0ZW1wdCB0byBleGVjdXRlIHF1ZXJ5IHdpdGggd3JvbmcgYXBpIGtleTogJHthcGlLZXl9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTkFVVEhPUklaRUQpLmpzb24oe2Vycm9yOiAnV3JvbmcgQVBJIGtleSd9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgfTtcbiAgICB9XG59Il19