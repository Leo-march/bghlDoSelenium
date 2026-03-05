import { Builder, By, until, WebDriver, WebElement } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';

const BASE_URL: string = 'http://localhost:8100/tabs/dashboard';
const PAUSA: number = 800;
const TIMEOUT: number = 15000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async function ultimoRegistroTest(): Promise<void> {
  const options = new chrome.Options();
  options.addArguments('--window-size=390,844');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');

  const driver: WebDriver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.css('.custom-header')), TIMEOUT);
    await sleep(PAUSA);

    // Scrolla até o final da lista
    await driver.executeScript(`
      document.querySelector('ion-content').shadowRoot
        .querySelector('.inner-scroll').scrollTop += 3000;
    `);
    await sleep(PAUSA);

    // Pega todos os itens e seleciona o último
    const itens: WebElement[] = await driver.wait(
      until.elementsLocated(By.css('.registro-item')),
      TIMEOUT
    );
    const ultimo: WebElement = itens[itens.length - 1];

    await driver.executeScript(
      "arguments[0].scrollIntoView({block:'center'});", ultimo
    );
    await sleep(PAUSA);

    await ultimo.click();
    await sleep(PAUSA);

    // Verifica que o último registro expandiu
    const classes: string = await ultimo.getAttribute('class');
    if (!classes.includes('expandido')) throw new Error('Último registro deveria estar expandido');
    console.log(`✅ Último registro (${itens.length}º item) clicado e expandido com sucesso`);

  } catch (err: any) {
    console.error('❌ Teste falhou:', err.message);
    process.exit(1);
  } finally {
    await driver.quit();
  }
})();