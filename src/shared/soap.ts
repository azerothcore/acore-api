import { request } from 'http';
import { Logger } from '@nestjs/common';

export class Soap {
  static command(command: string): void {
    const req = request(
      {
        hostname: process.env.SOAP_HOST_NAME,
        port: +process.env.SOAP_PORT,
        method: 'POST',
        auth: `${process.env.SOAP_USERNAME}:${process.env.SOAP_PASSWORD}`,
      },
      (res) => {
        if (res.statusCode !== 200) {
          Logger.error(`${res.statusMessage} ${res.statusCode}`, null, 'Soap');
        }
      },
    );

    req.write(Soap.execute(command));
    req.end();
  }

  private static escapeXml(value: string): string {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&apos;',
    };

    return value.replace(/[<>&"']/g, (char) => entities[char]);
  }

  private static execute(command: string): string {
    return `
        <?xml version="1.0" encoding="utf-8"?>
        <SOAP-ENV:Envelope
        xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"
        xmlns:xsi="http://www.w3.org/1999/XMLSchema-instance"
        xmlns:xsd="http://www.w3.org/1999/XMLSchema"
        xmlns:ns1="${process.env.SOAP_URI}">
    
        <SOAP-ENV:Body>
            <ns1:executeCommand><command>${Soap.escapeXml(command)}</command></ns1:executeCommand>
        </SOAP-ENV:Body>
    
        </SOAP-ENV:Envelope>
    `;
  }
}
