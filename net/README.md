# Запуск сети
_Все действия в каталоге processor_
## Установить зависимости
```
cd processor 
npm i
```
## Удалить все предыдущие контейнеры
```
docker rm -f $(docker ps -aq) && yes | docker network prune
```
## Запустить сеть
```
docker-compose -f network.yaml up
```
## Запустить transaction processor
```
node index.js
```
# Тестовые запросы
_Все действия в каталоге client_
## Установить зависимости
```
cd client 
npm i
```
## Положить данные в блокчейн
```
node index.js
```
## Прочитать данные из блокчейна
```
node check.js
```

# Troubleshooting
### Не проходят транзакции после перезапуска processor-а
#### Шаг 1 Перезапусите сеть - выполните команды в каталоге processor:
```
docker rm -f $(docker ps -aq) && yes | docker network prune`
docker-compose -f network.yaml up
```
#### Шаг 2 Запустите processor в каталоге processor:

```
node index.js
```

