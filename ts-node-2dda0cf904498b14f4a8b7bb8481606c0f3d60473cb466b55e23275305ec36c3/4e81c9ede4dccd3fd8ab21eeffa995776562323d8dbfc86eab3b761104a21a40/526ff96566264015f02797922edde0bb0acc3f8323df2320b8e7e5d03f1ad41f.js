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
                strArray.push(`${key}:${queryData[key]}`);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvbWlkZGxld2FyZS9hcGkua2V5LmNoZWNrZXIubWlkZGxld2FyZS50cyIsInNvdXJjZXMiOlsiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvbWlkZGxld2FyZS9hcGkua2V5LmNoZWNrZXIubWlkZGxld2FyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBLDJDQUF5RjtBQUV6RixnQ0FBZ0M7QUFDaEMsaUNBQWlDO0FBQ2pDLDZDQUE4QztBQUVqQyxRQUFBLEdBQUcsR0FBRyxDQUFDLFFBQWdCLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUVqRyxNQUFNLGtCQUFrQixHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUU7SUFDbEMsRUFBRSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDYixNQUFNLEdBQUcsVUFBVSxHQUFHLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVELE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQzdDLENBQUMsQ0FBQTtBQUdELElBQWEsdUJBQXVCLEdBQXBDO0lBQ0ksT0FBTyxDQUFDLEdBQUcsSUFBVztRQUNsQixNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFO1lBQ3RCLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFCLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEVBQTBFLENBQUMsQ0FBQztnQkFDeEYsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsbUJBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBQyxLQUFLLEVBQUUsZUFBZSxFQUFDLENBQUMsQ0FBQztZQUM5RSxDQUFDO1lBR0QsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN0QyxNQUFNLFNBQVMsR0FBRyxHQUFHLENBQUMsTUFBTSxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztZQUMvRCxNQUFNLFdBQVcsR0FBRyxHQUFHLFNBQVMsQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLENBQUM7WUFFdEQsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDO1lBQ2xCLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7Z0JBQ25DLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM5QyxDQUFDLENBQUMsQ0FBQztZQU9ILE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBQyxHQUFHLENBQUMsQ0FBQztZQUduRCxNQUFNLElBQUksR0FBRyxXQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxXQUFZLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxVQUFVLGVBQVMsQ0FBQyxPQUFPLG1CQUFtQixXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBR2hJLEVBQUUsQ0FBQyxDQUFDLElBQUksS0FBSyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpRkFBaUYsTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFDdkcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsbUJBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBQyxLQUFLLEVBQUUsZUFBZSxFQUFDLENBQUMsQ0FBQztZQUM5RSxDQUFDO1lBQ0QsSUFBSSxFQUFFLENBQUM7UUFDWCxDQUFDLENBQUM7SUFDTixDQUFDO0NBQ0osQ0FBQTtBQXBDWSx1QkFBdUI7SUFEbkMsbUJBQVUsRUFBRTtHQUNBLHVCQUF1QixDQW9DbkM7QUFwQ1ksMERBQXVCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtNaWRkbGV3YXJlLCBOZXN0TWlkZGxld2FyZSwgRXhwcmVzc01pZGRsZXdhcmUsIEh0dHBTdGF0dXN9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcblxuaW1wb3J0ICogYXMgY3JjMzIgZnJvbSAnY3JjLTMyJztcbmltcG9ydCAqIGFzIGNyeXB0byBmcm9tICdjcnlwdG8nO1xuaW1wb3J0IHtFbnZDb25maWd9IGZyb20gJy4uLy4uLy4uL2NvbmZpZy9lbnYnO1xuXG5leHBvcnQgY29uc3QgbWQ1ID0gKGNvbnRlbnRzOiBzdHJpbmcpID0+IGNyeXB0by5jcmVhdGVIYXNoKCdtZDUnKS51cGRhdGUoY29udGVudHMpLmRpZ2VzdCgnaGV4Jyk7XG5cbmNvbnN0IGRlY2ltYWxUb0hleFN0cmluZyA9IChudW1iZXIpID0+e1xuICAgIGlmIChudW1iZXIgPCAwKSB7XG4gICAgICAgIG51bWJlciA9IDB4RkZGRkZGRkYgKyBudW1iZXIgKyAxO1xuICAgIH1cblxuICAgIHJldHVybiBudW1iZXIudG9TdHJpbmcoMTYpLnRvTG93ZXJDYXNlKCk7XG59XG5cbkBNaWRkbGV3YXJlKClcbmV4cG9ydCBjbGFzcyBBcGlLZXlDaGVja2VyTWlkZGxld2FyZSBpbXBsZW1lbnRzIE5lc3RNaWRkbGV3YXJlIHtcbiAgICByZXNvbHZlKC4uLmFyZ3M6IGFueVtdKTogRXhwcmVzc01pZGRsZXdhcmUge1xuICAgICAgICByZXR1cm4gKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgICAgICAgICBpZiAoIXJlcS5oZWFkZXJzWydhcGkta2V5J10pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQXBpS2V5Q2hlY2tlck1pZGRsZXdhcmVAcmVzb2x2ZTogYXR0ZW1wdCB0byBleGVjdXRlIHF1ZXJ5IHdpdGggbm8gaXAga2V5Jyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTkFVVEhPUklaRUQpLmpzb24oe2Vycm9yOiAnV3JvbmcgQVBJIGtleSd9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdyZXEuaGVhZGVyc1thcGkta2V5XScsIHJlcS5oZWFkZXJzWydhcGkta2V5J10pO1xuICAgICAgICAgICAgLy8g0JPQtdC90LXRgNCw0YbQuNGPINC60LvRjtGH0LAgQVBJINC6INGC0LXQutGD0YnQtdC80YMg0LfQsNC/0YDQvtGB0YNcbiAgICAgICAgICAgIGNvbnN0IGFwaUtleSA9IHJlcS5oZWFkZXJzWydhcGkta2V5J107XG4gICAgICAgICAgICBjb25zdCBxdWVyeURhdGEgPSByZXEubWV0aG9kID09PSAnUE9TVCcgPyByZXEuYm9keSA6IHJlcS5xdWVyeTtcbiAgICAgICAgICAgIGNvbnN0IHBob25lTnVtYmVyID0gYCR7cXVlcnlEYXRhLnBob25lX251bWJlcn1gIHx8ICcnO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ3F1ZXJ5RGF0YScsIHF1ZXJ5RGF0YSk7XG4gICAgICAgICAgICBsZXQgc3RyQXJyYXkgPSBbXTtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKHF1ZXJ5RGF0YSkuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgc3RyQXJyYXkucHVzaChgJHtrZXl9OiR7cXVlcnlEYXRhW2tleV19YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdyZXEucGF0aCcsIHJlcS5wYXRoKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdzdHJBcnJheScsIHN0ckFycmF5KTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdFbnZDb25maWcuQVBJX0tFWScsIEVudkNvbmZpZy5BUElfS0VZKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdwaG9uZU51bWJlcicsIHBob25lTnVtYmVyKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdib2R5Jywgc3RyQXJyYXkuam9pbignOycpKyc7Jyk7XG5cbiAgICAgICAgICAgIGNvbnN0IGJvZHlTcmMgPSBjcmMzMi5ic3RyKHN0ckFycmF5LmpvaW4oJzsnKSsnOycpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2JvZHlTcmMgJywgZGVjaW1hbFRvSGV4U3RyaW5nKGJvZHlTcmMpKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke3JlcS5wYXRofTo6Ym9keTo6JHsgZGVjaW1hbFRvSGV4U3RyaW5nKGJvZHlTcmMpfTo6a2V5Ojoke0VudkNvbmZpZy5BUElfS0VZfTo6cGhvbmVfbnVtYmVyOjoke3Bob25lTnVtYmVyfWApO1xuICAgICAgICAgICAgY29uc3QgaGFzaCA9IG1kNShgJHtyZXEucGF0aH06OmJvZHk6OiR7IGRlY2ltYWxUb0hleFN0cmluZyhib2R5U3JjKX06OmtleTo6JHtFbnZDb25maWcuQVBJX0tFWX06OnBob25lX251bWJlcjo6JHtwaG9uZU51bWJlcn1gKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdoYXNoJywgaGFzaCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygn0L7RgtGA0LDQt9Cw0L3QvdCw0Y8g0YHRgtGA0L7QutCwJyxhcGlLZXkuc3Vic3RyaW5nKDAsIGFwaUtleS5sZW5ndGggLSAxNykgKTtcbiAgICAgICAgICAgIGlmIChoYXNoICE9PSBhcGlLZXkuc3Vic3RyaW5nKDAsIGFwaUtleS5sZW5ndGggLSAxNykpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgQXBpS2V5Q2hlY2tlck1pZGRsZXdhcmVAcmVzb2x2ZTogYXR0ZW1wdCB0byBleGVjdXRlIHF1ZXJ5IHdpdGggd3JvbmcgYXBpIGtleTogJHthcGlLZXl9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTkFVVEhPUklaRUQpLmpzb24oe2Vycm9yOiAnV3JvbmcgQVBJIGtleSd9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgfTtcbiAgICB9XG59Il19