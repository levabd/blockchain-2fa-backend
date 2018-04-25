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
const bodyParser = require("body-parser");
const fs = require('fs');
class MyHttpsOptions {
}
class MyOptions {
}
function bootstrap() {
    return __awaiter(this, void 0, void 0, function* () {
        const httpsOptions = new MyHttpsOptions();
        httpsOptions.key = fs.readFileSync('tmp/privkey.pem');
        httpsOptions.cert = fs.readFileSync('tmp/cert.pem');
        httpsOptions.ca = fs.readFileSync('tmp/chain.pem');
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
        yield app.listen(+env_1.EnvConfig.PORT, () => {
            console.log(`Started Chain-service on PORT ${env_1.EnvConfig.PORT}`);
        });
    });
}
bootstrap();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvc2VydmVyLnRzIiwic291cmNlcyI6WyIvaG9tZS9wZXNoa292L2Rldi9wcm9qZWN0cy9ibG9ja2NoYWluLTJmYS1iYWNrZW5kL3NyYy9zZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLHNDQUF1QztBQUN2Qyx1Q0FBeUM7QUFDekMscURBQXVEO0FBQ3ZELDZDQUErRDtBQUMvRCwwQ0FBMEM7QUFHMUMsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBRXpCO0NBSUM7QUFFRDtDQUVDO0FBRUQ7O1FBQ0ksTUFBTSxZQUFZLEdBQUcsSUFBSSxjQUFjLEVBQUUsQ0FBQztRQUMxQyxZQUFZLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUN0RCxZQUFZLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDcEQsWUFBWSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ25ELElBQUksRUFBRSxHQUFHLElBQUksU0FBUyxFQUFFLENBQUM7UUFDekIsRUFBRSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7UUFFL0IsTUFBTSxHQUFHLEdBQUcsTUFBTSxrQkFBVyxDQUFDLE1BQU0sQ0FBQyw4QkFBaUIsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUM1RCxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDWCxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBSTNCLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFO1lBQ3ZCLEdBQUcsQ0FBQyxNQUFNLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDL0MsR0FBRyxDQUFDLE1BQU0sQ0FBQyw4QkFBOEIsRUFBRSx5REFBeUQsQ0FBQyxDQUFDO1lBQ3RHLElBQUksRUFBRSxDQUFDO1FBQ1gsQ0FBQyxDQUFDLENBQUM7UUFNSCxNQUFNLE9BQU8sR0FBRyxJQUFJLHlCQUFlLEVBQUU7YUFDaEMsUUFBUSxDQUFDLGtCQUFrQixDQUFDO2FBQzVCLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBQzthQUN0QyxVQUFVLENBQUMsS0FBSyxDQUFDO2FBQ2pCLE1BQU0sQ0FBQyxjQUFjLENBQUM7YUFDdEIsS0FBSyxFQUFFLENBQUM7UUFFYixNQUFNLFFBQVEsR0FBRyx1QkFBYSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDNUQsdUJBQWEsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQVkvQyxNQUFNLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxlQUFTLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtZQUNuQyxPQUFPLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxlQUFTLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNuRSxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FBQTtBQUVELFNBQVMsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtFbnZDb25maWd9IGZyb20gJy4vY29uZmlnL2Vudic7XG5pbXBvcnQge05lc3RGYWN0b3J5fSBmcm9tICdAbmVzdGpzL2NvcmUnO1xuaW1wb3J0IHtBcHBsaWNhdGlvbk1vZHVsZX0gZnJvbSAnLi9tb2R1bGVzL2FwcC5tb2R1bGUnO1xuaW1wb3J0IHtTd2FnZ2VyTW9kdWxlLCBEb2N1bWVudEJ1aWxkZXJ9IGZyb20gJ0BuZXN0anMvc3dhZ2dlcic7XG5pbXBvcnQgKiBhcyBib2R5UGFyc2VyIGZyb20gJ2JvZHktcGFyc2VyJztcbmltcG9ydCB7TmVzdEFwcGxpY2F0aW9uT3B0aW9uc30gZnJvbSAnQG5lc3Rqcy9jb21tb24vaW50ZXJmYWNlcy9uZXN0LWFwcGxpY2F0aW9uLW9wdGlvbnMuaW50ZXJmYWNlJztcbmltcG9ydCB7SHR0cHNPcHRpb25zfSBmcm9tICdAbmVzdGpzL2NvbW1vbi9pbnRlcmZhY2VzL2h0dHBzLW9wdGlvbnMuaW50ZXJmYWNlJztcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcblxuY2xhc3MgTXlIdHRwc09wdGlvbnMgaW1wbGVtZW50cyBIdHRwc09wdGlvbnMge1xuICAgIGtleT86IGFueTtcbiAgICBjZXJ0PzogYW55O1xuICAgIGNhPzogYW55O1xufVxuXG5jbGFzcyBNeU9wdGlvbnMgaW1wbGVtZW50cyBOZXN0QXBwbGljYXRpb25PcHRpb25zIHtcbiAgICBodHRwc09wdGlvbnM/OiBIdHRwc09wdGlvbnM7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGJvb3RzdHJhcCgpIHtcbiAgICBjb25zdCBodHRwc09wdGlvbnMgPSBuZXcgTXlIdHRwc09wdGlvbnMoKTtcbiAgICBodHRwc09wdGlvbnMua2V5ID0gZnMucmVhZEZpbGVTeW5jKCd0bXAvcHJpdmtleS5wZW0nKTtcbiAgICBodHRwc09wdGlvbnMuY2VydCA9IGZzLnJlYWRGaWxlU3luYygndG1wL2NlcnQucGVtJyk7XG4gICAgaHR0cHNPcHRpb25zLmNhID0gZnMucmVhZEZpbGVTeW5jKCd0bXAvY2hhaW4ucGVtJyk7XG4gICAgbGV0IG1vID0gbmV3IE15T3B0aW9ucygpO1xuICAgIG1vLmh0dHBzT3B0aW9ucyA9IGh0dHBzT3B0aW9ucztcblxuICAgIGNvbnN0IGFwcCA9IGF3YWl0IE5lc3RGYWN0b3J5LmNyZWF0ZShBcHBsaWNhdGlvbk1vZHVsZSwgbW8pO1xuICAgIGFwcC5pbml0KCk7XG4gICAgYXBwLnVzZShib2R5UGFyc2VyLmpzb24oKSk7XG4gICAgLyoqXG4gICAgICogSGVhZGVycyBzZXR1cFxuICAgICAqL1xuICAgIGFwcC51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgICAgIHJlcy5oZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicsICcqJyk7XG4gICAgICAgIHJlcy5oZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnLCAnT3JpZ2luLCBYLVJlcXVlc3RlZC1XaXRoLCBDb250ZW50LVR5cGUsIEFjY2VwdCwgYXBpLWtleScpO1xuICAgICAgICBuZXh0KCk7XG4gICAgfSk7XG4gICAgLy8gYXBwLnVzZUdsb2JhbEZpbHRlcnMobmV3IEFwcEV4Y2VwdGlvbkZpbHRlcigpKTtcblxuICAgIC8qKlxuICAgICAqIFN3YWdnZXIgaW1wbGVtZW50YXRpb25cbiAgICAgKi9cbiAgICBjb25zdCBvcHRpb25zID0gbmV3IERvY3VtZW50QnVpbGRlcigpXG4gICAgICAgIC5zZXRUaXRsZSgnQ2hhaW5zZXJ2aWNlIEFQSScpXG4gICAgICAgIC5zZXREZXNjcmlwdGlvbignVGhlIENoYWluc2VydmljZSBBUEknKVxuICAgICAgICAuc2V0VmVyc2lvbignMS4wJylcbiAgICAgICAgLmFkZFRhZygnQ2hhaW5zZXJ2aWNlJylcbiAgICAgICAgLmJ1aWxkKCk7XG5cbiAgICBjb25zdCBkb2N1bWVudCA9IFN3YWdnZXJNb2R1bGUuY3JlYXRlRG9jdW1lbnQoYXBwLCBvcHRpb25zKTtcbiAgICBTd2FnZ2VyTW9kdWxlLnNldHVwKCcvYXBpLXN3ZycsIGFwcCwgZG9jdW1lbnQpO1xuXG4gICAgLyoqXG4gICAgICogIFNldCB1cCBzdGF0aWMgZmlsZXNcbiAgICAgKi9cbiAgICAvLyBhcHAudXNlKGV4cHJlc3Muc3RhdGljKF9fZGlybmFtZSArICcvbW9kdWxlcy93ZWIvcHVibGljJykpO1xuICAgIC8vIGFwcC5zZXQoJ3ZpZXdzJywgX19kaXJuYW1lICsgJy9tb2R1bGVzL3dlYi9wd2EvZGlzdCcpO1xuICAgIC8vIGFwcC5zZXQoJ3ZpZXcgZW5naW5lJywgJ2h0bWwnKTtcblxuICAgIC8qKlxuICAgICAqIFN0YXJ0IENoYWluc2VydmljZSBBUElcbiAgICAgKi9cbiAgICBhd2FpdCBhcHAubGlzdGVuKCtFbnZDb25maWcuUE9SVCwgKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhgU3RhcnRlZCBDaGFpbi1zZXJ2aWNlIG9uIFBPUlQgJHtFbnZDb25maWcuUE9SVH1gKTtcbiAgICB9KTtcbn1cblxuYm9vdHN0cmFwKCk7Il19