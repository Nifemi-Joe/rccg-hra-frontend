// src/components/QRCodeGenerator.tsx
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';

interface QRCodeGeneratorProps {
    value: string;
    title?: string;
    subtitle?: string;
}

export function QRCodeGenerator({ value, title, subtitle }: QRCodeGeneratorProps) {
    const qrRef = useRef<HTMLDivElement>(null);

    const handleDownload = () => {
        // value is already a data URL
        const link = document.createElement('a');
        link.download = `${title || 'qr-code'}.png`;
        link.href = value;
        link.click();
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
        <html>
          <head>
            <title>${title || 'QR Code'}</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                font-family: system-ui, sans-serif;
              }
              img { max-width: 300px; }
              h2 { margin: 20px 0 5px; }
              p { margin: 0; color: #666; }
            </style>
          </head>
          <body>
            <img src="${value}" alt="QR Code" />
            ${title ? `<h2>${title}</h2>` : ''}
            ${subtitle ? `<p>${subtitle}</p>` : ''}
          </body>
        </html>
      `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    return (
        <div ref={qrRef} className="flex flex-col items-center space-y-4 p-4">
            <div className="bg-white p-4 rounded-lg">
                <img src={value} alt="QR Code" className="w-64 h-64" />
            </div>

            {title && <h3 className="text-lg font-semibold text-center">{title}</h3>}
            {subtitle && <p className="text-sm text-muted-foreground text-center">{subtitle}</p>}

            <div className="flex gap-2">
                <Button variant="outline" onClick={handleDownload} className="gap-2">
                    <Download className="h-4 w-4" />
                    Download
                </Button>
                <Button variant="outline" onClick={handlePrint} className="gap-2">
                    <Printer className="h-4 w-4" />
                    Print
                </Button>
            </div>
        </div>
    );
}