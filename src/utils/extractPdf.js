import html2canvas from "html2canvas";
import jsPDF from "jspdf";


const exportPdf = (pdfRef, setLoading, fileName, restaurantName) => {
    const input = pdfRef.current;
    setLoading(true);
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;

      const imgProps = pdf.getImageProperties(imgData);
      const ratio = usableWidth / imgProps.width;
      const imgHeight = imgProps.height * ratio;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
      heightLeft -= usableHeight;

      while (heightLeft > 0) {
        pdf.addPage();
        position = -(imgHeight - heightLeft) + margin;
        pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
        heightLeft -= usableHeight;
      }
      setLoading(false);
      let docName = restaurantName + " - " + fileName + ".pdf";
      pdf.save(docName ? docName : "labo-orders.pdf");
    });
  };

  export default exportPdf