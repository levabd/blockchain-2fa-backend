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
        yield app.listen(+env_1.EnvConfig.PORT, () => {
            console.log(`Started Chain-service on PORT ${env_1.EnvConfig.PORT}`);
        });
    });
}
bootstrap();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvc2VydmVyLnRzIiwic291cmNlcyI6WyIvaG9tZS9wZXNoa292L2Rldi9wcm9qZWN0cy9ibG9ja2NoYWluLTJmYS1iYWNrZW5kL3NyYy9zZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLHNDQUF1QztBQUN2Qyx1Q0FBeUM7QUFDekMscURBQXVEO0FBQ3ZELDZDQUErRDtBQUUvRCwwQ0FBMEM7QUFHMUMsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBRXpCO0NBSUM7QUFFRDtDQUVDO0FBRUQ7O1FBQ0ksTUFBTSxZQUFZLEdBQUcsSUFBSSxjQUFjLEVBQUUsQ0FBQztRQUMxQyxZQUFZLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsb0RBQW9ELENBQUMsQ0FBQztRQUN6RixZQUFZLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsaURBQWlELENBQUMsQ0FBQztRQUN2RixZQUFZLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsa0RBQWtELENBQUMsQ0FBQztRQUN0RixJQUFJLEVBQUUsR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDO1FBQ3pCLEVBQUUsQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1FBRS9CLE1BQU0sR0FBRyxHQUFHLE1BQU0sa0JBQVcsQ0FBQyxNQUFNLENBQUMsOEJBQWlCLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDNUQsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ1gsR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUkzQixHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUN2QixHQUFHLENBQUMsTUFBTSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQy9DLEdBQUcsQ0FBQyxNQUFNLENBQUMsOEJBQThCLEVBQUUseURBQXlELENBQUMsQ0FBQztZQUN0RyxJQUFJLEVBQUUsQ0FBQztRQUNYLENBQUMsQ0FBQyxDQUFDO1FBTUgsTUFBTSxPQUFPLEdBQUcsSUFBSSx5QkFBZSxFQUFFO2FBQ2hDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQzthQUM1QixjQUFjLENBQUMsc0JBQXNCLENBQUM7YUFDdEMsVUFBVSxDQUFDLEtBQUssQ0FBQzthQUNqQixNQUFNLENBQUMsY0FBYyxDQUFDO2FBQ3RCLEtBQUssRUFBRSxDQUFDO1FBRWIsTUFBTSxRQUFRLEdBQUcsdUJBQWEsQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzVELHVCQUFhLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFZL0MsTUFBTSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsZUFBUyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUU7WUFDbkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQ0FBaUMsZUFBUyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDbkUsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQUE7QUFFRCxTQUFTLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7RW52Q29uZmlnfSBmcm9tICcuL2NvbmZpZy9lbnYnO1xuaW1wb3J0IHtOZXN0RmFjdG9yeX0gZnJvbSAnQG5lc3Rqcy9jb3JlJztcbmltcG9ydCB7QXBwbGljYXRpb25Nb2R1bGV9IGZyb20gJy4vbW9kdWxlcy9hcHAubW9kdWxlJztcbmltcG9ydCB7U3dhZ2dlck1vZHVsZSwgRG9jdW1lbnRCdWlsZGVyfSBmcm9tICdAbmVzdGpzL3N3YWdnZXInO1xuaW1wb3J0ICogYXMgZXhwcmVzcyBmcm9tICdleHByZXNzJztcbmltcG9ydCAqIGFzIGJvZHlQYXJzZXIgZnJvbSAnYm9keS1wYXJzZXInO1xuaW1wb3J0IHtOZXN0QXBwbGljYXRpb25PcHRpb25zfSBmcm9tICdAbmVzdGpzL2NvbW1vbi9pbnRlcmZhY2VzL25lc3QtYXBwbGljYXRpb24tb3B0aW9ucy5pbnRlcmZhY2UnO1xuaW1wb3J0IHtIdHRwc09wdGlvbnN9IGZyb20gJ0BuZXN0anMvY29tbW9uL2ludGVyZmFjZXMvaHR0cHMtb3B0aW9ucy5pbnRlcmZhY2UnO1xuY29uc3QgZnMgPSByZXF1aXJlKCdmcycpO1xuXG5jbGFzcyBNeUh0dHBzT3B0aW9ucyBpbXBsZW1lbnRzIEh0dHBzT3B0aW9ucyB7XG4gICAga2V5PzogYW55O1xuICAgIGNlcnQ/OiBhbnk7XG4gICAgY2E/OiBhbnk7XG59XG5cbmNsYXNzIE15T3B0aW9ucyBpbXBsZW1lbnRzIE5lc3RBcHBsaWNhdGlvbk9wdGlvbnMge1xuICAgIGh0dHBzT3B0aW9ucz86IEh0dHBzT3B0aW9ucztcbn1cblxuYXN5bmMgZnVuY3Rpb24gYm9vdHN0cmFwKCkge1xuICAgIGNvbnN0IGh0dHBzT3B0aW9ucyA9IG5ldyBNeUh0dHBzT3B0aW9ucygpO1xuICAgIGh0dHBzT3B0aW9ucy5rZXkgPSBmcy5yZWFkRmlsZVN5bmMoJy9ldGMvbGV0c2VuY3J5cHQvbGl2ZS9hbGxhdHJhY2stdGZhLnRrL3ByaXZrZXkucGVtJyk7XG4gICAgaHR0cHNPcHRpb25zLmNlcnQgPSBmcy5yZWFkRmlsZVN5bmMoJy9ldGMvbGV0c2VuY3J5cHQvbGl2ZS9hbGxhdHJhY2stdGZhLnRrL2NlcnQucGVtJyk7XG4gICAgaHR0cHNPcHRpb25zLmNhID0gZnMucmVhZEZpbGVTeW5jKCcvZXRjL2xldHNlbmNyeXB0L2xpdmUvYWxsYXRyYWNrLXRmYS50ay9jaGFpbi5wZW0nKTtcbiAgICBsZXQgbW8gPSBuZXcgTXlPcHRpb25zKCk7XG4gICAgbW8uaHR0cHNPcHRpb25zID0gaHR0cHNPcHRpb25zO1xuXG4gICAgY29uc3QgYXBwID0gYXdhaXQgTmVzdEZhY3RvcnkuY3JlYXRlKEFwcGxpY2F0aW9uTW9kdWxlLCBtbyk7XG4gICAgYXBwLmluaXQoKTtcbiAgICBhcHAudXNlKGJvZHlQYXJzZXIuanNvbigpKTtcbiAgICAvKipcbiAgICAgKiBIZWFkZXJzIHNldHVwXG4gICAgICovXG4gICAgYXBwLnVzZSgocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAgICAgcmVzLmhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJywgJyonKTtcbiAgICAgICAgcmVzLmhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycycsICdPcmlnaW4sIFgtUmVxdWVzdGVkLVdpdGgsIENvbnRlbnQtVHlwZSwgQWNjZXB0LCBhcGkta2V5Jyk7XG4gICAgICAgIG5leHQoKTtcbiAgICB9KTtcbiAgICAvLyBhcHAudXNlR2xvYmFsRmlsdGVycyhuZXcgQXBwRXhjZXB0aW9uRmlsdGVyKCkpO1xuXG4gICAgLyoqXG4gICAgICogU3dhZ2dlciBpbXBsZW1lbnRhdGlvblxuICAgICAqL1xuICAgIGNvbnN0IG9wdGlvbnMgPSBuZXcgRG9jdW1lbnRCdWlsZGVyKClcbiAgICAgICAgLnNldFRpdGxlKCdDaGFpbnNlcnZpY2UgQVBJJylcbiAgICAgICAgLnNldERlc2NyaXB0aW9uKCdUaGUgQ2hhaW5zZXJ2aWNlIEFQSScpXG4gICAgICAgIC5zZXRWZXJzaW9uKCcxLjAnKVxuICAgICAgICAuYWRkVGFnKCdDaGFpbnNlcnZpY2UnKVxuICAgICAgICAuYnVpbGQoKTtcblxuICAgIGNvbnN0IGRvY3VtZW50ID0gU3dhZ2dlck1vZHVsZS5jcmVhdGVEb2N1bWVudChhcHAsIG9wdGlvbnMpO1xuICAgIFN3YWdnZXJNb2R1bGUuc2V0dXAoJy9hcGktc3dnJywgYXBwLCBkb2N1bWVudCk7XG5cbiAgICAvKipcbiAgICAgKiAgU2V0IHVwIHN0YXRpYyBmaWxlc1xuICAgICAqL1xuICAgIC8vIGFwcC51c2UoZXhwcmVzcy5zdGF0aWMoX19kaXJuYW1lICsgJy9tb2R1bGVzL3dlYi9wdWJsaWMnKSk7XG4gICAgLy8gYXBwLnNldCgndmlld3MnLCBfX2Rpcm5hbWUgKyAnL21vZHVsZXMvd2ViL3B3YS9kaXN0Jyk7XG4gICAgLy8gYXBwLnNldCgndmlldyBlbmdpbmUnLCAnaHRtbCcpO1xuXG4gICAgLyoqXG4gICAgICogU3RhcnQgQ2hhaW5zZXJ2aWNlIEFQSVxuICAgICAqL1xuICAgIGF3YWl0IGFwcC5saXN0ZW4oK0VudkNvbmZpZy5QT1JULCAoKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBTdGFydGVkIENoYWluLXNlcnZpY2Ugb24gUE9SVCAke0VudkNvbmZpZy5QT1JUfWApO1xuICAgIH0pO1xufVxuXG5ib290c3RyYXAoKTsiXX0=