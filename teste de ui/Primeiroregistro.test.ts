import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';

const BASE_URL: string = 'http://localhost:8100/tabs/dashboard';
const PAUSA: number = 800;
const TIMEOUT: number = 15000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async function primeiroRegistroTest(): Promise<void> {
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

    // Scrolla até a lista de registros anteriores
    await driver.executeScript(`
      document.querySelector('ion-content').shadowRoot
        .querySelector('.inner-scroll').scrollTop += 700;
    `);
    await sleep(PAUSA);

    // Pega o primeiro item da lista
    const primeiro = await driver.wait(
      until.elementLocated(By.css('.registro-item')),
      TIMEOUT
    );
    await driver.executeScript(
      "arguments[0].scrollIntoView({block:'center'});", primeiro
    );
    await sleep(PAUSA);

    await primeiro.click();
    await sleep(PAUSA);

    // Verifica que o registro expandiu
    const expandido = await driver.findElement(
      By.css('.registro-item.expandido .registro-expandido')
    );
    const expandidoVisivel: boolean = await expandido.isDisplayed();
    if (!expandidoVisivel) throw new Error('Registro deveria estar expandido');
    console.log('✅ Primeiro registro clicado e expandido com sucesso');

  } catch (err: any) {
    console.error('❌ Teste falhou:', err.message);
    process.exit(1);
  } finally {
    await driver.quit();
  }
})();