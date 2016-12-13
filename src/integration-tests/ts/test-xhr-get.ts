import * as webdriver from 'selenium-webdriver';

const By = webdriver.By,
      until = webdriver.until;

export function test(driver, base): Promise<void> {
    driver.get(`${base}/xhr-get.html`);
    return driver.findElement(By.id('output')).then(output => {
        return driver.wait(until.elementIsVisible(output), 10000).then(() => {
            return output.getText().then(text => {
                if (text === "SUCCESS") {
                    return Promise.resolve();
                } else {
                    const msg = "xhr-get.html: AJAX should not have worked";
                    console.error(msg);
                    return Promise.reject(msg);
                }
            });
        });
    });
}