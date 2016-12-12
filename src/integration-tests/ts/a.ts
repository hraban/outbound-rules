import * as webdriver from 'selenium-webdriver';

const By = webdriver.By,
      until = webdriver.until;

export function testA(driver, base): Promise<void> {
    driver.get(`${base}/a.html`);
    return driver.findElement(By.id('output')).then(output => {
        return driver.wait(until.elementIsVisible(output), 5000).then(() => {
            return output.getText().then(text => {
                if (text === "SUCCESS") {
                    return Promise.resolve();
                } else {
                    const msg = "a.html: image should not have loaded";
                    console.error(msg);
                    return Promise.reject(msg);
                }
            });
        });
    });
}