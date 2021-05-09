<xsl:stylesheet xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="http://www.w3.org/1999/xhtml" version="3.0">

    <xsl:variable name="celeJmeno" select="string-join((/json/applicant/name, /json/applicant/surname), ' ')"/>

    <xsl:template match="/">
        <html>
            <head>
                <title>Žádost o potvrzení bezdlužnosti</title>
                <meta name="author" content="{$celeJmeno}"/>
            </head>
            <body>
                <xsl:apply-templates select="/json/applicant"/>
                <xsl:apply-templates select="/json/recipient"/>
                <section class="datum-misto">
                    <div>
                        <xsl:value-of select="/json/applicant/address/city"/>
                        <xsl:text> </xsl:text>
                        <xsl:value-of select="format-date(current-date(), '[D].&#x2009;[M].&#x2009;[Y]')"/>
                    </div>
                </section>
                <main>
                    <p class="vec">Žádost o potvrzení bezdlužnosti (případně rozpisu aktuálního dluhu)</p>
                    <p class="oslovení">Vážená paní, vážený pane,</p>

                    <xsl:apply-templates select="/json"/>

                    <p>
                        <xsl:text>Potvrzení je vydáváno za účelem </xsl:text>
                        <xsl:apply-templates select="/json/reason/*"/>
                        <xsl:text>.</xsl:text>
                    </p>
                    <xsl:apply-templates select="/json/reply_to/reply_to/*"/>

                    <p>S pozdravem</p>
                    <p class="podpis">
                        <xsl:value-of select="$celeJmeno"/>
                    </p>
                </main>
            </body>
        </html>
    </xsl:template>

    <xsl:template match="/json">
        <xsl:text> na základě rodného čísla </xsl:text>
        <strong>
            <xsl:value-of select="applicant/personal_identification_number"/>
        </strong>
        <xsl:if test="exists(applicant/company_registration_number/text())">
            <xsl:text> a IČO </xsl:text>
            <strong>
                <xsl:value-of select="applicant/company_registration_number"/>
            </strong>
        </xsl:if>
    </xsl:template>

    <xsl:template match="/json/applicant">
        <section class="odesilatel">
            <address>
                <div>
                    <xsl:apply-templates select="$celeJmeno"/>
                </div>
                <xsl:apply-templates select="address"/>
            </address>
            <xsl:apply-templates select="phone"/>
            <xsl:apply-templates select="email"/>
            <xsl:apply-templates select="data_box"/>
        </section>
    </xsl:template>

    <xsl:template match="/json/recipient">
        <section class="adresat">
            <address>
                <div>
                    <xsl:apply-templates select="name"/>
                </div>
                <xsl:apply-templates select="address"/>
            </address>
            <xsl:apply-templates select="phone"/>
            <xsl:apply-templates select="email"/>
            <xsl:apply-templates select="data_box"/>
        </section>
    </xsl:template>

    <xsl:template match="address | contact_address">
        <xsl:apply-templates select="lines"/>
        <div>
            <xsl:value-of select="substring(zip_code, 1, 3)"/>
            <xsl:text>&#x2009;</xsl:text>
            <xsl:value-of select="substring(zip_code, 4, 2)"/>
            <xsl:text>&#x2002;</xsl:text>
            <xsl:value-of select="city"/>
        </div>
    </xsl:template>

    <xsl:template match="address/lines | contact_address/lines">
        <div>
            <xsl:value-of select="."/>
        </div>
    </xsl:template>

    <xsl:template match="phone">
        <div>
            <img src="phone.svg" alignment-baseline="middle" padding-right="1mm"/>
            <xsl:value-of
                select="replace(replace(., '^(\d{3})(\d{3})(\d{3})$', '$1&#x2009;$2&#x2009;$3', ';j'), '^\+420(\d{3})(\d{3})(\d{3})$', '+420&#x2009;$1&#x2009;$2&#x2009;$3', ';j')"
            />
        </div>
    </xsl:template>

    <xsl:template match="email">
        <div>
            <img src="e-mail.svg" alignment-baseline="middle" padding-right="1mm"/>
            <xsl:value-of select="."/>
        </div>
    </xsl:template>

    <xsl:template match="data_box">
        <div>
            <img src="isds.svg" alignment-baseline="middle" padding-right="1mm"/>
            <xsl:value-of select="."/>
        </div>
    </xsl:template>

    <xsl:template match="/json/reason/job_office">
        <xsl:text>jednání u úřadu práce (dle zákona č. 435/2004 Sb., o zaměstnanosti, v platném znění)</xsl:text>
    </xsl:template>
    <xsl:template match="/json/reason/regional_office">
        <xsl:text>jednání u krajského úřadu (dle zákona č. 108/2006 Sb., o sociálních službách)</xsl:text>
    </xsl:template>
    <xsl:template match="/json/reason/bank">
        <xsl:text>jednání u bankovní instituce</xsl:text>
    </xsl:template>
    <xsl:template match="/json/reason/other">
        <xsl:value-of select="."/>
    </xsl:template>

    <xsl:template match="reply_to/data_box">
        <p>Odpověď prosím zašlete do datové schránky <strong><xsl:value-of select="."/></strong>.</p>
    </xsl:template>
    <xsl:template match="reply_to/in_person">
        <p>Odpověď si vyzvednu osobně.</p>
    </xsl:template>
    <xsl:template match="reply_to/permanent_addres">
        <p>Odpověď prosím doručte na adresu trvalého bydliště uvedenou v záhlaví žádosti.</p>
    </xsl:template>
    <xsl:template match="reply_to/contact_address">
        <p>Odpověď prosím doručte na adresu:</p>
        <address>
            <div>
                <xsl:apply-templates select="$celeJmeno"/>
            </div>
            <xsl:next-match/>
        </address>
    </xsl:template>

</xsl:stylesheet>
