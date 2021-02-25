<xsl:stylesheet xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:fo="http://www.w3.org/1999/XSL/Format"
    xmlns:xmp="adobe:ns:meta/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:x="http://www.jirsak.org/2020/XSLT-service" xpath-default-namespace="http://www.w3.org/1999/xhtml" version="3.0">

    <xsl:output encoding="UTF-8" method="xml" media-type="application/pdf" x:previous-templates="financni-urad-json.xsl" x:file-name="financni-urad.pdf"/>

    <xsl:template match="/">
        <fo:root>
            <fo:layout-master-set>
                <fo:simple-page-master master-name="page" page-height="297mm" page-width="210mm">
                    <fo:region-body margin-top="10mm" margin-bottom="10mm" margin-left="15mm" margin-right="15mm"/>
                </fo:simple-page-master>
            </fo:layout-master-set>
            <fo:declarations>
                <xmp:xmpmeta>
                    <rdf:RDF>
                        <rdf:Description>
                            <dc:title>
                                <xsl:value-of select="/html/head/title"/>
                            </dc:title>
                            <dc:creator>
                                <xsl:value-of select="/html/head/meta[@name = 'author']/@content"/>
                            </dc:creator>
                        </rdf:Description>
                    </rdf:RDF>
                </xmp:xmpmeta>
            </fo:declarations>

            <fo:page-sequence master-reference="page" font-family="Open Sans" font-size="10pt">
                <fo:flow flow-name="xsl-region-body">
                    <xsl:apply-templates select="/html/body/*"/>
                </fo:flow>
            </fo:page-sequence>
        </fo:root>
    </xsl:template>

    <xsl:template match="header">
        <fo:block-container margin-left="50%" margin-bottom="1.2em" line-height="1.2em">
            <fo:block-container margin-left="0mm">
                <xsl:apply-templates/>
            </fo:block-container>
        </fo:block-container>
    </xsl:template>

    <xsl:template match="address">
        <fo:block-container margin-bottom="1.2em">
            <xsl:apply-templates/>
        </fo:block-container>
    </xsl:template>

    <xsl:template match="h1">
        <fo:block text-align="center" font-size="16pt" font-weight="bold" margin-top="1.2em">
            <xsl:apply-templates/>
        </fo:block>
    </xsl:template>

    <xsl:template match="div[@class = 'subtitle']">
        <fo:block text-align="center" font-weight="bold" margin-bottom="1.2em">
            <xsl:apply-templates/>
        </fo:block>
    </xsl:template>

    <xsl:template match="section">
        <fo:block-container space-before="1.2em">
            <fo:block-container margin-left="0mm">
                <xsl:apply-templates/>
            </fo:block-container>
        </fo:block-container>
    </xsl:template>

    <xsl:template match="div">
        <fo:block text-align="left">
            <xsl:apply-templates/>
        </fo:block>
    </xsl:template>

    <xsl:template match="div[@class='podpis']">
        <fo:block text-align-last="justify">
            <fo:leader leader-pattern="dots" />
        </fo:block>
        <fo:block text-align="center">
            <xsl:apply-templates/>
        </fo:block>
    </xsl:template>

    <xsl:template match="p">
        <fo:block text-align="justify" line-height="1.2em">
            <xsl:apply-templates/>
        </fo:block>
    </xsl:template>

    <xsl:template match="ul">
        <fo:list-block>
            <xsl:apply-templates/>
        </fo:list-block>
    </xsl:template>

    <xsl:template match="strong">
        <fo:inline font-weight="bold">
            <xsl:apply-templates/>
        </fo:inline>
    </xsl:template>

    <xsl:template match="ul/li">
        <fo:list-item>
            <fo:list-item-label end-indent="label-end()">
                <fo:block>&#x2022;</fo:block>
            </fo:list-item-label>
            <fo:list-item-body start-indent="body-start()">
                <fo:block text-align="justify" line-height="120%">
                    <xsl:apply-templates/>
                </fo:block>
            </fo:list-item-body>
        </fo:list-item>
    </xsl:template>

    <xsl:template match="footer">
        <fo:block-container space-before="1.2em" line-height="1.2em">
            <fo:block-container margin-left="0mm">
                <xsl:apply-templates select="./div[@class='misto']"/>
            </fo:block-container>
            <fo:block-container margin-left="50%">
                <fo:block-container margin-left="10mm" margin-right="10mm">
                    <xsl:apply-templates select="./div[@class='podpis']"/>
                </fo:block-container>
            </fo:block-container>
        </fo:block-container>
    </xsl:template>


</xsl:stylesheet>
