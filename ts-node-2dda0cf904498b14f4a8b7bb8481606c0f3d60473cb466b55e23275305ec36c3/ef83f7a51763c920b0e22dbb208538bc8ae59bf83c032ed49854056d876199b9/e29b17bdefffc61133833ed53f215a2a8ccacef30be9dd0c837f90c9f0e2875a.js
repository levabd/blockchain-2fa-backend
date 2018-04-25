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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvc2VydmVyLnRzIiwic291cmNlcyI6WyIvaG9tZS9wZXNoa292L2Rldi9wcm9qZWN0cy9ibG9ja2NoYWluLTJmYS1iYWNrZW5kL3NyYy9zZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLHNDQUF1QztBQUN2Qyx1Q0FBeUM7QUFDekMscURBQXVEO0FBQ3ZELDZDQUErRDtBQUMvRCwwQ0FBMEM7QUFHMUMsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBRXpCO0NBSUM7QUFFRDtDQUVDO0FBRUQ7O1FBQ0ksTUFBTSxZQUFZLEdBQUcsSUFBSSxjQUFjLEVBQUUsQ0FBQztRQUMxQyxZQUFZLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsb0RBQW9ELENBQUMsQ0FBQztRQUN6RixZQUFZLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsaURBQWlELENBQUMsQ0FBQztRQUN2RixZQUFZLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsa0RBQWtELENBQUMsQ0FBQztRQUN0RixJQUFJLEVBQUUsR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDO1FBQ3pCLEVBQUUsQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1FBRS9CLE1BQU0sR0FBRyxHQUFHLE1BQU0sa0JBQVcsQ0FBQyxNQUFNLENBQUMsOEJBQWlCLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDNUQsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ1gsR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUkzQixHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUN2QixHQUFHLENBQUMsTUFBTSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQy9DLEdBQUcsQ0FBQyxNQUFNLENBQUMsOEJBQThCLEVBQUUseURBQXlELENBQUMsQ0FBQztZQUN0RyxJQUFJLEVBQUUsQ0FBQztRQUNYLENBQUMsQ0FBQyxDQUFDO1FBTUgsTUFBTSxPQUFPLEdBQUcsSUFBSSx5QkFBZSxFQUFFO2FBQ2hDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQzthQUM1QixjQUFjLENBQUMsc0JBQXNCLENBQUM7YUFDdEMsVUFBVSxDQUFDLEtBQUssQ0FBQzthQUNqQixNQUFNLENBQUMsY0FBYyxDQUFDO2FBQ3RCLEtBQUssRUFBRSxDQUFDO1FBRWIsTUFBTSxRQUFRLEdBQUcsdUJBQWEsQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzVELHVCQUFhLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFZL0MsTUFBTSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsZUFBUyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUU7WUFDbkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQ0FBaUMsZUFBUyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDbkUsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQUE7QUFFRCxTQUFTLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7RW52Q29uZmlnfSBmcm9tICcuL2NvbmZpZy9lbnYnO1xuaW1wb3J0IHtOZXN0RmFjdG9yeX0gZnJvbSAnQG5lc3Rqcy9jb3JlJztcbmltcG9ydCB7QXBwbGljYXRpb25Nb2R1bGV9IGZyb20gJy4vbW9kdWxlcy9hcHAubW9kdWxlJztcbmltcG9ydCB7U3dhZ2dlck1vZHVsZSwgRG9jdW1lbnRCdWlsZGVyfSBmcm9tICdAbmVzdGpzL3N3YWdnZXInO1xuaW1wb3J0ICogYXMgYm9keVBhcnNlciBmcm9tICdib2R5LXBhcnNlcic7XG5pbXBvcnQge05lc3RBcHBsaWNhdGlvbk9wdGlvbnN9IGZyb20gJ0BuZXN0anMvY29tbW9uL2ludGVyZmFjZXMvbmVzdC1hcHBsaWNhdGlvbi1vcHRpb25zLmludGVyZmFjZSc7XG5pbXBvcnQge0h0dHBzT3B0aW9uc30gZnJvbSAnQG5lc3Rqcy9jb21tb24vaW50ZXJmYWNlcy9odHRwcy1vcHRpb25zLmludGVyZmFjZSc7XG5jb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG5cbmNsYXNzIE15SHR0cHNPcHRpb25zIGltcGxlbWVudHMgSHR0cHNPcHRpb25zIHtcbiAgICBrZXk/OiBhbnk7XG4gICAgY2VydD86IGFueTtcbiAgICBjYT86IGFueTtcbn1cblxuY2xhc3MgTXlPcHRpb25zIGltcGxlbWVudHMgTmVzdEFwcGxpY2F0aW9uT3B0aW9ucyB7XG4gICAgaHR0cHNPcHRpb25zPzogSHR0cHNPcHRpb25zO1xufVxuXG5hc3luYyBmdW5jdGlvbiBib290c3RyYXAoKSB7XG4gICAgY29uc3QgaHR0cHNPcHRpb25zID0gbmV3IE15SHR0cHNPcHRpb25zKCk7XG4gICAgaHR0cHNPcHRpb25zLmtleSA9IGZzLnJlYWRGaWxlU3luYygnL2V0Yy9sZXRzZW5jcnlwdC9saXZlL2FsbGF0cmFjay10ZmEudGsvcHJpdmtleS5wZW0nKTtcbiAgICBodHRwc09wdGlvbnMuY2VydCA9IGZzLnJlYWRGaWxlU3luYygnL2V0Yy9sZXRzZW5jcnlwdC9saXZlL2FsbGF0cmFjay10ZmEudGsvY2VydC5wZW0nKTtcbiAgICBodHRwc09wdGlvbnMuY2EgPSBmcy5yZWFkRmlsZVN5bmMoJy9ldGMvbGV0c2VuY3J5cHQvbGl2ZS9hbGxhdHJhY2stdGZhLnRrL2NoYWluLnBlbScpO1xuICAgIGxldCBtbyA9IG5ldyBNeU9wdGlvbnMoKTtcbiAgICBtby5odHRwc09wdGlvbnMgPSBodHRwc09wdGlvbnM7XG5cbiAgICBjb25zdCBhcHAgPSBhd2FpdCBOZXN0RmFjdG9yeS5jcmVhdGUoQXBwbGljYXRpb25Nb2R1bGUsIG1vKTtcbiAgICBhcHAuaW5pdCgpO1xuICAgIGFwcC51c2UoYm9keVBhcnNlci5qc29uKCkpO1xuICAgIC8qKlxuICAgICAqIEhlYWRlcnMgc2V0dXBcbiAgICAgKi9cbiAgICBhcHAudXNlKChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgICAgICByZXMuaGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nLCAnKicpO1xuICAgICAgICByZXMuaGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJywgJ09yaWdpbiwgWC1SZXF1ZXN0ZWQtV2l0aCwgQ29udGVudC1UeXBlLCBBY2NlcHQsIGFwaS1rZXknKTtcbiAgICAgICAgbmV4dCgpO1xuICAgIH0pO1xuICAgIC8vIGFwcC51c2VHbG9iYWxGaWx0ZXJzKG5ldyBBcHBFeGNlcHRpb25GaWx0ZXIoKSk7XG5cbiAgICAvKipcbiAgICAgKiBTd2FnZ2VyIGltcGxlbWVudGF0aW9uXG4gICAgICovXG4gICAgY29uc3Qgb3B0aW9ucyA9IG5ldyBEb2N1bWVudEJ1aWxkZXIoKVxuICAgICAgICAuc2V0VGl0bGUoJ0NoYWluc2VydmljZSBBUEknKVxuICAgICAgICAuc2V0RGVzY3JpcHRpb24oJ1RoZSBDaGFpbnNlcnZpY2UgQVBJJylcbiAgICAgICAgLnNldFZlcnNpb24oJzEuMCcpXG4gICAgICAgIC5hZGRUYWcoJ0NoYWluc2VydmljZScpXG4gICAgICAgIC5idWlsZCgpO1xuXG4gICAgY29uc3QgZG9jdW1lbnQgPSBTd2FnZ2VyTW9kdWxlLmNyZWF0ZURvY3VtZW50KGFwcCwgb3B0aW9ucyk7XG4gICAgU3dhZ2dlck1vZHVsZS5zZXR1cCgnL2FwaS1zd2cnLCBhcHAsIGRvY3VtZW50KTtcblxuICAgIC8qKlxuICAgICAqICBTZXQgdXAgc3RhdGljIGZpbGVzXG4gICAgICovXG4gICAgLy8gYXBwLnVzZShleHByZXNzLnN0YXRpYyhfX2Rpcm5hbWUgKyAnL21vZHVsZXMvd2ViL3B1YmxpYycpKTtcbiAgICAvLyBhcHAuc2V0KCd2aWV3cycsIF9fZGlybmFtZSArICcvbW9kdWxlcy93ZWIvcHdhL2Rpc3QnKTtcbiAgICAvLyBhcHAuc2V0KCd2aWV3IGVuZ2luZScsICdodG1sJyk7XG5cbiAgICAvKipcbiAgICAgKiBTdGFydCBDaGFpbnNlcnZpY2UgQVBJXG4gICAgICovXG4gICAgYXdhaXQgYXBwLmxpc3RlbigrRW52Q29uZmlnLlBPUlQsICgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coYFN0YXJ0ZWQgQ2hhaW4tc2VydmljZSBvbiBQT1JUICR7RW52Q29uZmlnLlBPUlR9YCk7XG4gICAgfSk7XG59XG5cbmJvb3RzdHJhcCgpOyJdfQ==