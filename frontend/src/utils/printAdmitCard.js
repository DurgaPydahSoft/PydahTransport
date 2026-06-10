import { waitForPrintImages } from './studentPhoto';

/**
 * After React renders the admit card, wait for images then trigger print.
 */
export const triggerAdmitCardPrint = async (printFn, containerRef) => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await waitForPrintImages(containerRef?.current);
    printFn();
};
