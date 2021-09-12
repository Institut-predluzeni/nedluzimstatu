<xsl:stylesheet xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:x="https://jinotaj.org/2020/XSLT-service"
    xmlns="http://www.w3.org/1999/xhtml" version="3.0">

    <xsl:output encoding="UTF-8" method="xml" media-type="application/pdf" x:next-templates="pdf.xsl" x:file-name="zadost-financni-urad.pdf"/>

    <xsl:import href="common.xsl"/>

    <xsl:template match="/json">
        <xsl:choose>
            <xsl:when test="exists(items/*)">
                <p>
                    <xsl:text>žádám tímto o vystavení potvrzení, že magistrát/městský/obecní úřad neevidují vůči mé osobě žádné nedoplatky, případně žádám o jejich výpis, a to za: </xsl:text>
                </p>
                <ul>
                    <xsl:apply-templates select="items/*"/>
                </ul>
            </xsl:when>
            <xsl:otherwise>
                <p>
                    <xsl:text>žádám tímto o vystavení potvrzení, že magistrát/městský/obecní úřad neevidují vůči mé osobě žádné nedoplatky, případně žádám o jejich výpis.</xsl:text>
                </p>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>


    <xsl:template match="items/dog">
        <xsl:if test="xs:boolean(.)">
            <li>poplatek za psa</li>
        </xsl:if>
    </xsl:template>

    <xsl:template match="items/bins">
        <xsl:if test="xs:boolean(.)">
            <li>místní poplatek za svoz komunálního odpadu</li>
        </xsl:if>
    </xsl:template>

    <xsl:template match="items/offenses">
        <xsl:if test="xs:boolean(.)">
            <li>přestupky</li>
        </xsl:if>
    </xsl:template>

    <xsl:template match="items/flat">
        <xsl:if test="xs:boolean(.)">
            <li>nájemné a služby spojené s užíváním městského/obecního bytu</li>
        </xsl:if>
    </xsl:template>

    <xsl:template match="items/reason">
        <xsl:if test="exists(.)">
            <li>
                <xsl:value-of select="."/>
            </li>
        </xsl:if>
    </xsl:template>


</xsl:stylesheet>
