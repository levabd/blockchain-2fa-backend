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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvbWlkZGxld2FyZS9qc29uLm1pZGRsZXdhcmUudHMiLCJzb3VyY2VzIjpbIi9ob21lL3Blc2hrb3YvZGV2L3Byb2plY3RzL2Jsb2NrY2hhaW4tMmZhLWJhY2tlbmQvc3JjL21vZHVsZXMvYXBpL21pZGRsZXdhcmUvanNvbi5taWRkbGV3YXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUEsMkNBQXlGO0FBSXpGLElBQWEsY0FBYyxHQUEzQjtJQUNJLE9BQU8sQ0FBQyxHQUFHLElBQVc7UUFDbEIsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUN0QixNQUFNLFlBQVksR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksS0FBSyxDQUFDO1lBQzdFLEVBQUUsQ0FBQyxDQUFDLFlBQVksSUFBSSxZQUFZLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLEtBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMvRCxPQUFPLENBQUMsR0FBRyxDQUFDLGdGQUFnRixDQUFDLENBQUM7Z0JBQzlGLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLG1CQUFVLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUM1RSxDQUFDO1lBQ0QsSUFBSSxFQUFFLENBQUM7UUFDWCxDQUFDLENBQUM7SUFDTixDQUFDO0NBQ0osQ0FBQTtBQVhZLGNBQWM7SUFEMUIsbUJBQVUsRUFBRTtHQUNBLGNBQWMsQ0FXMUI7QUFYWSx3Q0FBYyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7TWlkZGxld2FyZSwgTmVzdE1pZGRsZXdhcmUsIEV4cHJlc3NNaWRkbGV3YXJlLCBIdHRwU3RhdHVzfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XG5cblxuQE1pZGRsZXdhcmUoKVxuZXhwb3J0IGNsYXNzIEpzb25NaWRkbGV3YXJlIGltcGxlbWVudHMgTmVzdE1pZGRsZXdhcmUge1xuICAgIHJlc29sdmUoLi4uYXJnczogYW55W10pOiBFeHByZXNzTWlkZGxld2FyZSB7XG4gICAgICAgIHJldHVybiAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFjY2VwdGhlYWRlciA9IHJlcS5oZWFkZXJzWydhY2NlcHQnXSB8fCByZXEuaGVhZGVyc1snQWNjZXB0J10gfHwgZmFsc2U7XG4gICAgICAgICAgICBpZiAoYWNjZXB0aGVhZGVyICYmIGFjY2VwdGhlYWRlci5zZWFyY2goJ2FwcGxpY2F0aW9uL2pzb24nKT09PS0xKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0pzb25NaWRkbGV3YXJlQHJlc29sdmU6IGFwcCBhcGkgd2FpdCBqc29uIGRhdGEuIE5vdCBqc29uIHR5cGUgZ2l2ZW4gaW4gaGVhZGVyIScpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuTUVUSE9EX05PVF9BTExPV0VEKS5qc29uKCdOb3QgQWNjZXB0YWJsZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICB9O1xuICAgIH1cbn0iXX0=