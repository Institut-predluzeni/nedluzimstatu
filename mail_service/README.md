# Konfigurace mail-service pro Nedlužím státu
Při volání enpointu `/zadosti` v [mail-service](https://hub.docker.com/repository/docker/filipjirsak/mail-service) se zavolá
funkce `sendMail` v JavaScriptovém souboru `zadosti.js` (jméno souboru bez přípony `.js` tvoří jméno endpointu).
Tatu funkce vrací objekt popisující e-mail, který se má odeslat – obsahuje e-mailovou adresu odesílatele a příjemce,
předmět e-mailu, soubory tvořící tělo e-mailu a soubory tvořící přílohy e-mailu (přílohy
se stahují z HTTP endpointů `transformer-service`).

V souborech `zadost.txt` a `zadost.html` je obsah, který bude tvořit tělo e-mailu.

## Konfigurace mail-service
```yaml
mail-service:
  repositories:
    default:
      api-key: XXXXXXXXXXXXXXXXXXXX
```
`api-key` je API token pro SendGrid.

## Konfigurace externích služeb
`Mail-service` aktuálně podporuje odesílání e-mailů přes [SendGrid](https://sendgrid.com).
Konfigurace (API token) musí být  uvedena v souboru `application.yaml` služby `mail-service`.
Tento soubor není součástí Git repository (API token musí být držen v tajnosti).
