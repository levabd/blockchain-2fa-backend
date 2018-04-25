"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./config/env");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./modules/app.module");
const swagger_1 = require("@nestjs/swagger");
const express = require("express");
const bodyParser = require("body-parser");
const fs = require('fs');
class MyHttpsOptions {
}
class MyOptions {
}
function bootstrap() {
    return __awaiter(this, void 0, void 0, function* () {
        const httpsOptions = new MyHttpsOptions();
        httpsOptions.key = fs.readFileSync('/etc/letsencrypt/live/allatrack-tfa.tk/privkey.pem');
        httpsOptions.cert = fs.readFileSync('/etc/letsencrypt/live/allatrack-tfa.tk/cert.pem');
        httpsOptions.ca = fs.readFileSync('/etc/letsencrypt/live/allatrack-tfa.tk/chain.pem');
        let mo = new MyOptions();
        mo.httpsOptions = httpsOptions;
        const app = yield core_1.NestFactory.create(app_module_1.ApplicationModule, mo);
        app.init();
        app.use(bodyParser.json());
        app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, api-key');
            next();
        });
        const options = new swagger_1.DocumentBuilder()
            .setTitle('Chainservice API')
            .setDescription('The Chainservice API')
            .setVersion('1.0')
            .addTag('Chainservice')
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, options);
        swagger_1.SwaggerModule.setup('/api-swg', app, document);
        app.use(express.static(__dirname + '/modules/web/public'));
        app.set('views', __dirname + '/modules/web/pwa/dist');
        app.set('view engine', 'html');
        yield app.listen(+env_1.EnvConfig.PORT, () => {
            console.log(`Started Chain-service on PORT ${env_1.EnvConfig.PORT}`);
        });
    });
}
bootstrap();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvc2VydmVyLnRzIiwic291cmNlcyI6WyIvaG9tZS9wZXNoa292L2Rldi9wcm9qZWN0cy9ibG9ja2NoYWluLTJmYS1iYWNrZW5kL3NyYy9zZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLHNDQUF1QztBQUN2Qyx1Q0FBeUM7QUFDekMscURBQXVEO0FBQ3ZELDZDQUErRDtBQUMvRCxtQ0FBbUM7QUFDbkMsMENBQTBDO0FBRzFDLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUV6QjtDQUlDO0FBRUQ7Q0FFQztBQUVEOztRQUNJLE1BQU0sWUFBWSxHQUFHLElBQUksY0FBYyxFQUFFLENBQUM7UUFDMUMsWUFBWSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLG9EQUFvRCxDQUFDLENBQUM7UUFDekYsWUFBWSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLGlEQUFpRCxDQUFDLENBQUM7UUFDdkYsWUFBWSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLGtEQUFrRCxDQUFDLENBQUM7UUFDdEYsSUFBSSxFQUFFLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQztRQUN6QixFQUFFLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztRQUUvQixNQUFNLEdBQUcsR0FBRyxNQUFNLGtCQUFXLENBQUMsTUFBTSxDQUFDLDhCQUFpQixFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzVELEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNYLEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFJM0IsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUU7WUFDdkIsR0FBRyxDQUFDLE1BQU0sQ0FBQyw2QkFBNkIsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUMvQyxHQUFHLENBQUMsTUFBTSxDQUFDLDhCQUE4QixFQUFFLHlEQUF5RCxDQUFDLENBQUM7WUFDdEcsSUFBSSxFQUFFLENBQUM7UUFDWCxDQUFDLENBQUMsQ0FBQztRQU1ILE1BQU0sT0FBTyxHQUFHLElBQUkseUJBQWUsRUFBRTthQUNoQyxRQUFRLENBQUMsa0JBQWtCLENBQUM7YUFDNUIsY0FBYyxDQUFDLHNCQUFzQixDQUFDO2FBQ3RDLFVBQVUsQ0FBQyxLQUFLLENBQUM7YUFDakIsTUFBTSxDQUFDLGNBQWMsQ0FBQzthQUN0QixLQUFLLEVBQUUsQ0FBQztRQUViLE1BQU0sUUFBUSxHQUFHLHVCQUFhLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM1RCx1QkFBYSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBSy9DLEdBQUcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEdBQUcscUJBQXFCLENBQUMsQ0FBQyxDQUFDO1FBQzNELEdBQUcsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLFNBQVMsR0FBRyx1QkFBdUIsQ0FBQyxDQUFDO1FBQ3RELEdBQUcsQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBSy9CLE1BQU0sR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLGVBQVMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFO1lBQ25DLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUNBQWlDLGVBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ25FLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUFBO0FBRUQsU0FBUyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0VudkNvbmZpZ30gZnJvbSAnLi9jb25maWcvZW52JztcbmltcG9ydCB7TmVzdEZhY3Rvcnl9IGZyb20gJ0BuZXN0anMvY29yZSc7XG5pbXBvcnQge0FwcGxpY2F0aW9uTW9kdWxlfSBmcm9tICcuL21vZHVsZXMvYXBwLm1vZHVsZSc7XG5pbXBvcnQge1N3YWdnZXJNb2R1bGUsIERvY3VtZW50QnVpbGRlcn0gZnJvbSAnQG5lc3Rqcy9zd2FnZ2VyJztcbmltcG9ydCAqIGFzIGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgKiBhcyBib2R5UGFyc2VyIGZyb20gJ2JvZHktcGFyc2VyJztcbmltcG9ydCB7TmVzdEFwcGxpY2F0aW9uT3B0aW9uc30gZnJvbSAnQG5lc3Rqcy9jb21tb24vaW50ZXJmYWNlcy9uZXN0LWFwcGxpY2F0aW9uLW9wdGlvbnMuaW50ZXJmYWNlJztcbmltcG9ydCB7SHR0cHNPcHRpb25zfSBmcm9tICdAbmVzdGpzL2NvbW1vbi9pbnRlcmZhY2VzL2h0dHBzLW9wdGlvbnMuaW50ZXJmYWNlJztcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcblxuY2xhc3MgTXlIdHRwc09wdGlvbnMgaW1wbGVtZW50cyBIdHRwc09wdGlvbnMge1xuICAgIGtleT86IGFueTtcbiAgICBjZXJ0PzogYW55O1xuICAgIGNhPzogYW55O1xufVxuXG5jbGFzcyBNeU9wdGlvbnMgaW1wbGVtZW50cyBOZXN0QXBwbGljYXRpb25PcHRpb25zIHtcbiAgICBodHRwc09wdGlvbnM/OiBIdHRwc09wdGlvbnM7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGJvb3RzdHJhcCgpIHtcbiAgICBjb25zdCBodHRwc09wdGlvbnMgPSBuZXcgTXlIdHRwc09wdGlvbnMoKTtcbiAgICBodHRwc09wdGlvbnMua2V5ID0gZnMucmVhZEZpbGVTeW5jKCcvZXRjL2xldHNlbmNyeXB0L2xpdmUvYWxsYXRyYWNrLXRmYS50ay9wcml2a2V5LnBlbScpO1xuICAgIGh0dHBzT3B0aW9ucy5jZXJ0ID0gZnMucmVhZEZpbGVTeW5jKCcvZXRjL2xldHNlbmNyeXB0L2xpdmUvYWxsYXRyYWNrLXRmYS50ay9jZXJ0LnBlbScpO1xuICAgIGh0dHBzT3B0aW9ucy5jYSA9IGZzLnJlYWRGaWxlU3luYygnL2V0Yy9sZXRzZW5jcnlwdC9saXZlL2FsbGF0cmFjay10ZmEudGsvY2hhaW4ucGVtJyk7XG4gICAgbGV0IG1vID0gbmV3IE15T3B0aW9ucygpO1xuICAgIG1vLmh0dHBzT3B0aW9ucyA9IGh0dHBzT3B0aW9ucztcblxuICAgIGNvbnN0IGFwcCA9IGF3YWl0IE5lc3RGYWN0b3J5LmNyZWF0ZShBcHBsaWNhdGlvbk1vZHVsZSwgbW8pO1xuICAgIGFwcC5pbml0KCk7XG4gICAgYXBwLnVzZShib2R5UGFyc2VyLmpzb24oKSk7XG4gICAgLyoqXG4gICAgICogSGVhZGVycyBzZXR1cFxuICAgICAqL1xuICAgIGFwcC51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgICAgIHJlcy5oZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicsICcqJyk7XG4gICAgICAgIHJlcy5oZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnLCAnT3JpZ2luLCBYLVJlcXVlc3RlZC1XaXRoLCBDb250ZW50LVR5cGUsIEFjY2VwdCwgYXBpLWtleScpO1xuICAgICAgICBuZXh0KCk7XG4gICAgfSk7XG4gICAgLy8gYXBwLnVzZUdsb2JhbEZpbHRlcnMobmV3IEFwcEV4Y2VwdGlvbkZpbHRlcigpKTtcblxuICAgIC8qKlxuICAgICAqIFN3YWdnZXIgaW1wbGVtZW50YXRpb25cbiAgICAgKi9cbiAgICBjb25zdCBvcHRpb25zID0gbmV3IERvY3VtZW50QnVpbGRlcigpXG4gICAgICAgIC5zZXRUaXRsZSgnQ2hhaW5zZXJ2aWNlIEFQSScpXG4gICAgICAgIC5zZXREZXNjcmlwdGlvbignVGhlIENoYWluc2VydmljZSBBUEknKVxuICAgICAgICAuc2V0VmVyc2lvbignMS4wJylcbiAgICAgICAgLmFkZFRhZygnQ2hhaW5zZXJ2aWNlJylcbiAgICAgICAgLmJ1aWxkKCk7XG5cbiAgICBjb25zdCBkb2N1bWVudCA9IFN3YWdnZXJNb2R1bGUuY3JlYXRlRG9jdW1lbnQoYXBwLCBvcHRpb25zKTtcbiAgICBTd2FnZ2VyTW9kdWxlLnNldHVwKCcvYXBpLXN3ZycsIGFwcCwgZG9jdW1lbnQpO1xuXG4gICAgLyoqXG4gICAgICogIFNldCB1cCBzdGF0aWMgZmlsZXNcbiAgICAgKi9cbiAgICBhcHAudXNlKGV4cHJlc3Muc3RhdGljKF9fZGlybmFtZSArICcvbW9kdWxlcy93ZWIvcHVibGljJykpO1xuICAgIGFwcC5zZXQoJ3ZpZXdzJywgX19kaXJuYW1lICsgJy9tb2R1bGVzL3dlYi9wd2EvZGlzdCcpO1xuICAgIGFwcC5zZXQoJ3ZpZXcgZW5naW5lJywgJ2h0bWwnKTtcblxuICAgIC8qKlxuICAgICAqIFN0YXJ0IENoYWluc2VydmljZSBBUElcbiAgICAgKi9cbiAgICBhd2FpdCBhcHAubGlzdGVuKCtFbnZDb25maWcuUE9SVCwgKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhgU3RhcnRlZCBDaGFpbi1zZXJ2aWNlIG9uIFBPUlQgJHtFbnZDb25maWcuUE9SVH1gKTtcbiAgICB9KTtcbn1cblxuYm9vdHN0cmFwKCk7Il19