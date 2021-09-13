/**
 * Základní URL transformation-service, ke které se připojují adresy konkrétních endpointů.
 * @type {string}
 */
const baseURL = "https://nedluzimstatu.cz/transformation-service";

/**
 * Hlavičky posílané na endpointy transformation-service.
 * @type {{Accept: string, "Content-Type": string}}
 */
const defaultHeaders = {
    "Content-Type": "application/json",
    "Accept": "application/pdf"
}

/**
 * Funkce realizující samotné odeslání e-mailu. Volá se při každém zavolání tohoto endpointu
 * a jako vstup dostane objekt z HTTP požadavku.
 *
 * @param data Data, která přišla v POST požadavku.
 * @returns Konfigurace Popisující e-mail, který se má odeslat.
 */
function sendMail(data) {
    const attachments = []
    if (data.recipients["celni-sprava"]) {
        attachments.push(
            HTTP.post(
                `${baseURL}/celni-sprava`, {
                    headers: defaultHeaders,
                    data: JSON.stringify({
                        recipient: data.recipients["celni-sprava"],
                        applicant: data.applicant,
                        reply_to: data.reply_to,
                        reason: data.reason
                    })
                }, {
                    filename: "celni-sprava.pdf",
                    type: "application/pdf"
                })
        );
    }

    if (data.recipients["financni-urad"]) {
        attachments.push(
            HTTP.post(
                `${baseURL}/financni-urad`, {
                    headers: defaultHeaders,
                    data: JSON.stringify({
                        recipient: data.recipients["financni-urad"],
                        applicant: data.applicant,
                        reply_to: data.reply_to,
                        reason: data.reason
                    })
                }, {
                    filename: "financni-urad.pdf",
                    type: "application/pdf"
                })
        );
    }

    if (data.recipients["obec"]) {
        attachments.push(
            HTTP.post(
                `${baseURL}/obec`, {
                    headers: defaultHeaders,
                    data: JSON.stringify({
                        recipient: data.recipients["obec"],
                        items: data.items,
                        applicant: data.applicant,
                        reply_to: data.reply_to,
                        reason: data.reason
                    })
                }, {
                    filename: "obec.pdf",
                    type: "application/pdf"
                })
        );
    }

    if (data.recipients["ossz"]) {
        attachments.push(
            HTTP.post(
                `${baseURL}/ossz`, {
                    headers: defaultHeaders,
                    data: JSON.stringify({
                        recipient: data.recipients["ossz"],
                        applicant: data.applicant,
                        reply_to: data.reply_to,
                        reason: data.reason
                    })
                }, {
                    filename: "ossz.pdf",
                    type: "application/pdf"
                })
        );
    }

    if (data.recipients["pojistovna"]) {
        const createPojistovnaAttachment = (pojistovna) => {
            attachments.push(
                HTTP.post(
                    `${baseURL}/pojistovna`, {
                        headers: defaultHeaders,
                        data: JSON.stringify({
                            recipient: pojistovna,
                            applicant: data.applicant,
                            reply_to: data.reply_to,
                            reason: data.reason
                        })
                    }, {
                        filename: `${pojistovna.name}.pdf`,
                        type: "application/pdf"
                    })
            );
        }
        const pojistovnaData = data.recipients["pojistovna"]
        if (Array.isArray(pojistovnaData)) {
            pojistovnaData.forEach(createPojistovnaAttachment)
        } else {
            createPojistovnaAttachment(pojistovnaData)
        }
    }

    return {
        from: {
            name: "Nedlužím státu",
            email: "formulare@nedluzimstatu.cz"
        },
        to: {
            email: data.recipientEmail,
	    name: data.recipientName
        },
        subject: "Nedlužím státu: Vygenerovali jsme Vaše žádosti pro ověření bezdlužnosti",
        content: [
            File.read("zadost.txt", "text/plain"),
            File.read("zadost.html", "text/html")
        ],
        attachments: attachments
    }
}

//GraalVM aktuálně neumí ESM exporty, místo toho je exportován poslední výraz skriptu.
sendMail;
