"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
let JsonMiddleware = class JsonMiddleware {
    resolve(...args) {
        return (req, res, next) => {
            const acceptheader = req.headers['accept'] || req.headers['Accept'] || false;
            if (acceptheader && acceptheader.search('application/json') === -1) {
                console.log('JsonMiddleware@resolve: app api wait json data. Not json type given in header!');
                return res.status(common_1.HttpStatus.METHOD_NOT_ALLOWED).json('Not Acceptable');
            }
            next();
        };
    }
};
JsonMiddleware = __decorate([
    common_1.Middleware()
], JsonMiddleware);
exports.JsonMiddleware = JsonMiddleware;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvbWlkZGxld2FyZS9qc29uLm1pZGRsZXdhcmUudHMiLCJzb3VyY2VzIjpbIi9ob21lL3Blc2hrb3YvZGV2L3Byb2plY3RzL2Jsb2NrY2hhaW4tMmZhLWJhY2tlbmQvc3JjL21vZHVsZXMvYXBpL21pZGRsZXdhcmUvanNvbi5taWRkbGV3YXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUEsMkNBQXlGO0FBR3pGLElBQWEsY0FBYyxHQUEzQjtJQUNJLE9BQU8sQ0FBQyxHQUFHLElBQVc7UUFDbEIsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUN0QixNQUFNLFlBQVksR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksS0FBSyxDQUFDO1lBQzdFLEVBQUUsQ0FBQyxDQUFDLFlBQVksSUFBSSxZQUFZLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLEtBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMvRCxPQUFPLENBQUMsR0FBRyxDQUFDLGdGQUFnRixDQUFDLENBQUM7Z0JBQzlGLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLG1CQUFVLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUM1RSxDQUFDO1lBQ0QsSUFBSSxFQUFFLENBQUM7UUFDWCxDQUFDLENBQUM7SUFDTixDQUFDO0NBQ0osQ0FBQTtBQVhZLGNBQWM7SUFEMUIsbUJBQVUsRUFBRTtHQUNBLGNBQWMsQ0FXMUI7QUFYWSx3Q0FBYyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7TWlkZGxld2FyZSwgTmVzdE1pZGRsZXdhcmUsIEV4cHJlc3NNaWRkbGV3YXJlLCBIdHRwU3RhdHVzfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XG5cbkBNaWRkbGV3YXJlKClcbmV4cG9ydCBjbGFzcyBKc29uTWlkZGxld2FyZSBpbXBsZW1lbnRzIE5lc3RNaWRkbGV3YXJlIHtcbiAgICByZXNvbHZlKC4uLmFyZ3M6IGFueVtdKTogRXhwcmVzc01pZGRsZXdhcmUge1xuICAgICAgICByZXR1cm4gKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhY2NlcHRoZWFkZXIgPSByZXEuaGVhZGVyc1snYWNjZXB0J10gfHwgcmVxLmhlYWRlcnNbJ0FjY2VwdCddIHx8IGZhbHNlO1xuICAgICAgICAgICAgaWYgKGFjY2VwdGhlYWRlciAmJiBhY2NlcHRoZWFkZXIuc2VhcmNoKCdhcHBsaWNhdGlvbi9qc29uJyk9PT0tMSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdKc29uTWlkZGxld2FyZUByZXNvbHZlOiBhcHAgYXBpIHdhaXQganNvbiBkYXRhLiBOb3QganNvbiB0eXBlIGdpdmVuIGluIGhlYWRlciEnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk1FVEhPRF9OT1RfQUxMT1dFRCkuanNvbignTm90IEFjY2VwdGFibGUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgfTtcbiAgICB9XG59Il19