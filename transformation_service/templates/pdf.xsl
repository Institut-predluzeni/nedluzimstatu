<xsl:stylesheet xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:fo="http://www.w3.org/1999/XSL/Format"
    xmlns:xmp="adobe:ns:meta/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:x="http://www.jirsak.org/2020/XSLT-service" xpath-default-namespace="http://www.w3.org/1999/xhtml" version="3.0">

    <xsl:output encoding="UTF-8" method="xml" media-type="application/pdf" x:previous-templates="financni-urad-json.xsl" x:file-name="financni-urad.pdf"/>

    <xsl:variable name="line-height">1.2em</xsl:variable>

    <xsl:template match="/">
        <fo:root>
            <fo:layout-master-set>
                <fo:simple-page-master master-name="page" page-height="297mm" page-width="210mm">
                    <fo:region-body margin-top="20mm" margin-bottom="20mm" margin-left="15mm" margin-right="15mm"/>
                    <fo:region-after region-name="footer" extent="5mm"/>
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

            <fo:page-sequence master-reference="page" font-family="Open Sans" font-size="11pt">
                <fo:static-content flow-name="footer">
                    <fo:block text-align="right" font-size="8pt" font-style="italic" margin-right="10mm" color="gray">Vytvořeno na <fo:basic-link external-destination="https://nedluzimstatu.cz">nedluzimstatu.cz</fo:basic-link>.</fo:block>
                </fo:static-content>
                <fo:flow flow-name="xsl-region-body">
                    <xsl:apply-templates select="/html/body/*"/>
                </fo:flow>
            </fo:page-sequence>
        </fo:root>
    </xsl:template>
   

    <xsl:template match="section[contains-token(@class, 'odesilatel')]">
        <fo:block-container margin-bottom="{$line-height}">
            <xsl:apply-templates/>
        </fo:block-container>
    </xsl:template>
    
    <xsl:template match="section[contains-token(@class,'adresat')]">
        <fo:block-container margin-bottom="{$line-height}">
            <xsl:apply-templates/>
        </fo:block-container>
    </xsl:template>
    
    <xsl:template match="address">
        <fo:block-container margin-bottom="0.5 * {$line-height}">
            <xsl:apply-templates/>
        </fo:block-container>
    </xsl:template>

    <xsl:template match="address/div[1]">
        <fo:block text-align="left" line-height="{$line-height}" font-weight="bold">
            <xsl:apply-templates/>
        </fo:block>
    </xsl:template>
    
    <xsl:template match="section[contains-token(@class,'datum-misto')]/div">
        <fo:block text-align="left" line-height="{$line-height}">
            <xsl:apply-templates/>
        </fo:block>
    </xsl:template>
    
    <xsl:template match="main">
        <fo:block-container margin-bottom="{$line-height}">
            <xsl:apply-templates/>
        </fo:block-container>
    </xsl:template>
    
    <xsl:template match="div">
        <fo:block text-align="left" line-height="{$line-height}">
            <xsl:apply-templates/>
        </fo:block>
    </xsl:template>
   
   
    <xsl:template match="p">
        <fo:block text-align="justify" line-height="{$line-height}">
            <xsl:if test="local-name(following-sibling::*[1]) != 'ul'">
                <xsl:attribute name="margin-bottom" select="$line-height"/>
            </xsl:if>
            <xsl:apply-templates/>
        </fo:block>
    </xsl:template>
    
    <xsl:template match="p[contains-token(@class, 'vec')]">
        <fo:block text-align="left" margin-top="2 * {$line-height}" margin-bottom="2 * {$line-height}" line-height="{$line-height}" font-weight="bold">
            <xsl:apply-templates/>
        </fo:block>
    </xsl:template>
    
    <xsl:template match="p[contains-token(@class, 'podpis')]">
        <xsl:variable name="width">80mm</xsl:variable>
        <fo:block-container width="{$width}">
            <fo:block text-align="center" line-height="{$line-height}"  margin-top="6 * {$line-height}">
                <fo:leader leader-pattern="dots" leader-length="{$width}"/>
            </fo:block>
            <fo:block text-align="center" line-height="1.5em">
                <xsl:apply-templates/>
            </fo:block>            
        </fo:block-container>
    </xsl:template>
    
    <xsl:template match="ul">
        <fo:list-block margin-bottom="{$line-height}">
            <xsl:apply-templates/>
        </fo:list-block>
    </xsl:template>
    
    <xsl:template match="ul/li">
        <fo:list-item>
            <fo:list-item-label end-indent="label-end()">
                <fo:block>&#x2022;</fo:block>
            </fo:list-item-label>
            <fo:list-item-body start-indent="body-start()">
                <fo:block text-align="justify" line-height="{$line-height}">
                    <xsl:apply-templates/>
                </fo:block>
            </fo:list-item-body>
        </fo:list-item>
    </xsl:template>
    
    <xsl:template match="strong">
        <fo:inline font-weight="bold">
            <xsl:apply-templates/>
        </fo:inline>
    </xsl:template>

    <xsl:template match="small">
        <fo:inline font-size="85%">
            <xsl:apply-templates/>
        </fo:inline>
    </xsl:template>
    
    <xsl:template match="img">
        <fo:instream-foreign-object>
            <xsl:copy-of select="@*[local-name() != 'src']"/>
            <xsl:copy-of select="doc(@src)"/>
        </fo:instream-foreign-object>
    </xsl:template>
    

</xsl:stylesheet>
