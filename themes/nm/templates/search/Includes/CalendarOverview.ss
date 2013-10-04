<section>
	<ol>
		<% loop UpcomingEvents %>
			<li itemscope itemtype="http://schema.org/Event">
				<meta itemprop="startDate" content="$StartDate">
				<a href="/calendar/{$UrlHash}/">
					<time>$DateRangeNice</time>
					<h3><span itemprop="name">$Title</span></h3>
				</a>
			</li>
		<% end_loop %>
	<ol>
</section>