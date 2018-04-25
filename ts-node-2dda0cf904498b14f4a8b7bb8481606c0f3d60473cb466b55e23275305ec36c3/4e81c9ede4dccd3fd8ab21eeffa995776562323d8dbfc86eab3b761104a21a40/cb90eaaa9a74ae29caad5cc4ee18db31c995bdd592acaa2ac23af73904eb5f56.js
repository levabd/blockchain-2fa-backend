"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
let LoggerMiddleware = class LoggerMiddleware {
    resolve(...args) {
        return (req, res, next) => {
            console.log('Request', req.path);
            next();
        };
    }
};
LoggerMiddleware = __decorate([
    common_1.Middleware()
], LoggerMiddleware);
exports.LoggerMiddleware = LoggerMiddleware;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvbWlkZGxld2FyZS9sb2dnZXIubWlkZGxld2FyZS50cyIsInNvdXJjZXMiOlsiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvbWlkZGxld2FyZS9sb2dnZXIubWlkZGxld2FyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBLDJDQUErRTtBQUcvRSxJQUFhLGdCQUFnQixHQUE3QjtJQUNJLE9BQU8sQ0FBQyxHQUFHLElBQVc7UUFDbEIsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUN0QixPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDakMsSUFBSSxFQUFFLENBQUM7UUFDWCxDQUFDLENBQUM7SUFDTixDQUFDO0NBQ0osQ0FBQTtBQVBZLGdCQUFnQjtJQUQ1QixtQkFBVSxFQUFFO0dBQ0EsZ0JBQWdCLENBTzVCO0FBUFksNENBQWdCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWlkZGxld2FyZSwgTmVzdE1pZGRsZXdhcmUsIEV4cHJlc3NNaWRkbGV3YXJlIH0gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xuXG5ATWlkZGxld2FyZSgpXG5leHBvcnQgY2xhc3MgTG9nZ2VyTWlkZGxld2FyZSBpbXBsZW1lbnRzIE5lc3RNaWRkbGV3YXJlIHtcbiAgICByZXNvbHZlKC4uLmFyZ3M6IGFueVtdKTogRXhwcmVzc01pZGRsZXdhcmUge1xuICAgICAgICByZXR1cm4gKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnUmVxdWVzdCcsIHJlcS5wYXRoKTtcbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgfTtcbiAgICB9XG59Il19