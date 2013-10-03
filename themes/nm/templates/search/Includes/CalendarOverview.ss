<section>
	<ol>
		<% loop UpcomingEvents %>
			<li>
				<a href="/calendar/{$UrlHash}/">
					<time>$DateRangeNice</time>
					<h3>$Title</h3>
				</a>
			</li>
		<% end_loop %>
	<ol>
</section>