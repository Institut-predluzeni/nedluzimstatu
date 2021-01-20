### Overview

Repozitar projektu Nedluzim Statu.

Obsahuje definici infrastruktury na AWS a staticke soubory (html/css/js) samotneho webu. Samotny web je vytvoreny na 
Wordpressu (s pouzitim DiVi) a deployovany staticky pres plugin `WP2Static`

### Uzitecne odkazy

Wiki Nedluzim statu: https://wiki.cesko.digital/display/NS

### Struktura
- `static_content` Staticky web generovany z Wordpressove instance pomoci WP2Static pluginu. 
  Deployuje se pri kazde zmene v masteru na AWS S3 pomoci workflow `static_content_deploy.yaml`.
  
- `infrastructure` Terraform definice infrastruktury. Pri kazde zmene v masteru se deployuje na AWS Cesko.Digital.

- `.github/workflows` Github Actions definice pro deployment.

### Wordpress instance

Development instance wordpressu muze byt provozovana kdekoli, neni efektivne nijak propojena se samotnou produkci.
 V nasem pripade pouzivame micro instanci na AWS Cesko.Digital. Na ni je script, ktery pri kazdem vygenerovani 
WP2Static buildu tento build pushne do Githubu. 

#### Zalohovani Development Instance

Samotna sablona (AMI) pouzita v Terraformu je nastavena s celym WP stackem a vsemi potrebnymi scripty pro pushovani 
updatu do Githubu, ale nema aktualni data. Proto je pri update, nebo vytvoreni nove Wordpress instance potreba importovat 
data pluginem `All-in-one WP migration` z puvodni instance.

Navic aktualni ec2 instance ma nastavene zalohovani (1x denne, zivotnost 7 dni) pres sluzbu AWS Backup. Pokud bude 
potreba udelat rollback/obnoveni development instance, jde takto obnovit cele ec2. Ale maximalne po dobu 7 dni.