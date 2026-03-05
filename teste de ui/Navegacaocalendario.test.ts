import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';

const BASE_URL: string = 'http://localhost:8100/tabs/dashboard';
const PAUSA: number = 800;
const TIMEOUT: number = 15000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async function navegacaoCalendarioTest(): Promise<void> {
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

    // Clica na aba Calendário
    const abaCalendario = await driver.wait(
      until.elementLocated(By.css("ion-tab-button[tab='calendario']")),
      TIMEOUT
    );
    await abaCalendario.click();
    await sleep(PAUSA);

    const urlCalendario: string = await driver.getCurrentUrl();
    if (!urlCalendario.includes('calendario')) throw new Error('URL deveria conter "calendario"');
    console.log('✅ Navegou para a aba Calendário');

    // Clica na aba Registros para voltar
    const abaRegistros = await driver.wait(
      until.elementLocated(By.css("ion-tab-button[tab='dashboard']")),
      TIMEOUT
    );
    await abaRegistros.click();
    await sleep(PAUSA);

    const urlDashboard: string = await driver.getCurrentUrl();
    if (!urlDashboard.includes('dashboard')) throw new Error('URL deveria conter "dashboard"');

    const header = await driver.findElement(By.css('.custom-header h1'));
    const headerVisivel: boolean = await header.isDisplayed();
    if (!headerVisivel) throw new Error('Header deveria estar visível ao voltar');
    console.log('✅ Voltou para a aba Registros com sucesso');

  } catch (err: any) {
    console.error('❌ Teste falhou:', err.message);
    process.exit(1);
  } finally {
    await driver.quit();
  }
})();