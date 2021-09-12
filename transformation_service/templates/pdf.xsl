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

    <xsl:template match="img[@src='e-mail.svg']">
        <fo:instream-foreign-object alignment-baseline="middle" padding-right="1mm">
            <svg width="8" height="8" viewBox="0 0 49 49" xmlns="http://www.w3.org/2000/svg">
                <path fill="black" d="M21.26.15a24,24,0,0,0,0,47.7A2.43,2.43,0,0,0,24,45.44v-.16a2.45,2.45,0,0,0-2.21-2.41A19,19,0,1,1,43,24v3.47a3.51,3.51,0,0,1-4.24,3.43A3.58,3.58,0,0,1,36,27.37V14.5a2.49,2.49,0,0,0-5-.22,12,12,0,1,0,1.61,18A8.37,8.37,0,0,0,38.92,36,8.51,8.51,0,0,0,48,27.47V24A24,24,0,0,0,21.26.15ZM24,31a7,7,0,1,1,7-7A7,7,0,0,1,24,31Z"/>
            </svg>
        </fo:instream-foreign-object>
    </xsl:template>

    <xsl:template match="img[@src='isds.svg']">
        <fo:instream-foreign-object alignment-baseline="middle" padding-right="1mm">
            <svg width="10" height="5" viewBox="4 25 230 145" version="1.1" xmlns="http://www.w3.org/2000/svg">
                <path fill="black" d="M228.063,13.847c-0.502,-0.77 -1.127,-1.169 -1.825,-1.169l-85.458,0.014c-1.253,0 -2.254,1.293 -2.254,2.892l0,23.961c0,1.557 1.001,2.835 2.254,2.835l37.148,0l-80.104,80.106c-0.501,0.529 -0.822,1.252 -0.822,2.015c0,0.767 0.321,1.479 0.822,2.02l16.99,16.968c0.985,0.998 3.004,0.998 4.019,0l79.966,-79.981l0,78.378c0,1.256 1.294,2.254 2.897,2.254l24,0c1.56,0 2.839,-0.998 2.839,-2.254l0,-126.834c0,-0.41 -0.137,-0.837 -0.472,-1.205" style="fill-rule:nonzero;"/><path d="M119.461,12.692l-112.084,0c-0.639,0 -1.28,0.386 -1.766,1.121c-0.335,0.423 -0.515,0.829 -0.515,1.26l-0,126.828c-0,1.247 1.294,2.269 2.851,2.269l24.003,0c1.599,0 2.852,-1.022 2.852,-2.269l-0,-78.383l47.487,47.467c0.883,0.885 2.507,0.678 3.635,-0.45l16.946,-16.946c1.101,-1.099 1.296,-2.711 0.409,-3.599l-47.56,-47.581l63.742,0c1.252,0 2.28,-1.289 2.28,-2.853l-0,-24.002c-0,-1.574 -1.028,-2.862 -2.28,-2.862"/>
            </svg>
        </fo:instream-foreign-object>
    </xsl:template>

    <xsl:template match="img[@src='phone.svg']">
        <fo:instream-foreign-object alignment-baseline="middle" padding-right="1mm">
            <svg width="8" height="8" viewBox="0 0 18 18" version="1.1" xmlns="http://www.w3.org/2000/svg">
                <path fill="black" d="M16.23,12.26l-2.54,-0.29c-0.61,-0.07 -1.21,0.14 -1.64,0.57l-1.84,1.84c-2.83,-1.44 -5.15,-3.75 -6.59,-6.59l1.85,-1.85c0.43,-0.43 0.64,-1.03 0.57,-1.64l-0.29,-2.52c-0.12,-1.01 -0.97,-1.77 -1.99,-1.77l-1.73,-0c-1.13,-0 -2.07,0.94 -2,2.07c0.53,8.54 7.36,15.36 15.89,15.89c1.13,0.07 2.07,-0.87 2.07,-2l-0,-1.73c0.01,-1.01 -0.75,-1.86 -1.76,-1.98Z"/>
            </svg>
        </fo:instream-foreign-object>
    </xsl:template>

    <xsl:template match="img">
        <fo:instream-foreign-object>
            <xsl:copy-of select="@*[local-name() != 'src']"/>
            <xsl:copy-of select="doc(@src)"/>
        </fo:instream-foreign-object>
    </xsl:template>


</xsl:stylesheet>
