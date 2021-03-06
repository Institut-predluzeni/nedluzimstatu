<xsl:stylesheet
		xmlns:xs="http://www.w3.org/2001/XMLSchema"
		xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
		xmlns:x="http://www.jirsak.org/2020/XSLT-service"
		xmlns="http://www.w3.org/1999/xhtml"
		version="3.0">

	<xsl:template match="/">
		<html>
			<head>
				<title>Žádost o potvrzení bezdlužnosti</title>
				<meta name="author" content="{x:cele-jmeno(/json/zadatel)}"/>
			</head>
			<body>
				<xsl:apply-templates/>
			</body>
		</html>
	</xsl:template>

	<xsl:template match="/json">
		<xsl:param name="content" />
		<xsl:apply-templates select="urad"/>
		<main>
			<h1>Žádost o potvrzení bezdlužnosti</h1>
			<div class="subtitle">případně rozpisu aktuálního dluhu</div>

			<xsl:copy-of select="$content"/>

			<xsl:apply-templates select="odpoved"/>

			<section>
				<div>Kontaktní údaje:</div>
				<div>Jméno a příjmení:
					<strong>
						<xsl:value-of select="x:cele-jmeno(zadatel)"/>
					</strong>
				</div>
				<div>Rodné číslo:
					<strong>
						<xsl:value-of select="zadatel/rodneCislo"/>
					</strong>
				</div>
				<div>Trvalé bydliště:
					<strong>
						<xsl:value-of select="string-join((zadatel/adresa/radky, x:adresa-psc-obec(zadatel/adresa)), ', ')"/>
					</strong>
				</div>
				<div>Telefon:
					<strong>
						<xsl:value-of select="zadatel/telefon"/>
					</strong>
				</div>
				<div>E-mail:
					<strong>
						<xsl:value-of select="zadatel/email"/>
					</strong>
				</div>
			</section>
		</main>
		<xsl:apply-templates select="podpis"/>
	</xsl:template>

	<xsl:template match="/json/urad">
		<header>
			<address>
				<xsl:for-each select="adresa/radky">
					<div>
						<xsl:value-of select="."/>
					</div>
				</xsl:for-each>
				<div>
					<xsl:value-of select="x:adresa-psc-obec(adresa)"/>
				</div>
			</address>
			<div>ID datové schránky:
				<strong>
					<xsl:value-of select="datovaSchranka"/>
				</strong>
			</div>
			<div>Telefon:
				<strong>
					<xsl:value-of select="telefon"/>
				</strong>
			</div>
			<div>E-mail:
				<strong>
					<xsl:value-of select="email"/>
				</strong>
			</div>
		</header>
	</xsl:template>

	<xsl:template match="/json/podpis">
		<footer>
			<div class="misto">
				<xsl:text>V </xsl:text>
				<xsl:value-of select="misto"/>
				<xsl:text> </xsl:text>
				<xsl:value-of select="format-date(datum, '[D].&#x2009;[M].&#x2009;[Y0001]')"/>
				<xsl:text>.</xsl:text>
			</div>
			<div class="podpis">
				<xsl:value-of select="x:cele-jmeno(.)"/>
			</div>
		</footer>
	</xsl:template>

	<xsl:template match="/json/odpoved/trvaleBydliste">
		<p>Odpověď mi prosím doručte na adresu trvalého bydliště.</p>
	</xsl:template>

	<xsl:template match="/json/odpoved/osobne">
		<p>Odpověď si vyzvednu osobně.</p>
	</xsl:template>

	<xsl:template match="/json/odpoved/email">
		<p>Odpověď mi prosím doručte e-mailem na adresu <strong><xsl:value-of select="."/></strong>.</p>
	</xsl:template>

	<xsl:template match="/json/odpoved/datovaSchranka">
		<p>Odpověď mi prosím doručte do datové schránky <strong><xsl:value-of select="."/></strong>.</p>
	</xsl:template>

	<xsl:function name="x:cele-jmeno" as="xs:string">
		<xsl:param name="element" as="element()"/>
		<xsl:sequence select="string-join(($element/jmeno, $element/prijmeni), ' ')"/>
	</xsl:function>

	<xsl:function name="x:adresa-psc-obec" as="xs:string">
		<xsl:param name="adresa" as="element()"/>
		<xsl:sequence select="string-join((x:psc($adresa/psc), $adresa/obec), '&#x2002;')"/>
	</xsl:function>

	<xsl:function name="x:psc" as="xs:string">
		<xsl:param name="psc" as="xs:string"/>
		<xsl:sequence select="string-join((substring($psc, 1, 3), substring($psc, 4, 2)), '&#x2007;')"/>
	</xsl:function>
</xsl:stylesheet>
