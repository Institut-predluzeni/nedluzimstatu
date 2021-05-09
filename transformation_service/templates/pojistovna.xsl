<xsl:stylesheet xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:x="https://jinotaj.org/2020/XSLT-service"
    xmlns="http://www.w3.org/1999/xhtml" version="3.0">

    <xsl:output encoding="UTF-8" method="xml" media-type="application/pdf" x:next-templates="pdf.xsl" x:file-name="zadost-financni-urad.pdf"/>

    <xsl:import href="common.xsl"/>

    <xsl:template match="/json">
        <p>
            <xsl:text>tímto žádám o vystavení potvrzení, že zdravotní pojišťovna vůči mé osobě neeviduje žádné nedoplatky, případně žádám o jejich výpis v rozdělení na jistinu a příslušenství </xsl:text>
            <xsl:next-match/>
            <xsl:text>.</xsl:text>
        </p>
    </xsl:template>

</xsl:stylesheet>
