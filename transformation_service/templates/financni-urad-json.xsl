<xsl:stylesheet
		xmlns:xs="http://www.w3.org/2001/XMLSchema"
		xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
		xmlns:x="http://www.jirsak.org/2020/XSLT-service"
		xmlns="http://www.w3.org/1999/xhtml"
		version="3.0">

	<xsl:output encoding="UTF-8" method="xml"/>

	<xsl:import href="common.xsl"/>

	<xsl:template match="/json">
		<xsl:next-match>
			<xsl:with-param name="content">
				<p>Tímto žádám o vystavení potvrzení, že orgány Finanční správy České republiky vůči mé osobě neevidují žádné nedoplatky, případně žádám o jejich výpis,
					na základě uvedeného rodného čísla.
				</p>
				<p>Potvrzení je vydáváno za účelem:</p>
				<ul>
					<xsl:for-each select="ucel">
						<li><xsl:value-of select="."/></li>
					</xsl:for-each>
				</ul>
			</xsl:with-param>
		</xsl:next-match>
	</xsl:template>

</xsl:stylesheet>
