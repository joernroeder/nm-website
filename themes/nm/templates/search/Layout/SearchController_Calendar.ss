<% if CalendarItem %>
	<% with CalendarItem %>
		<article itemscope itemtype="http://schema.org/Event">
			<meta itemprop="startDate" content="$StartDate">
			<meta itemprop="endDate" content="$EndDate">
			<meta itemprop="description" content="$MarkdownedText.XML">
			<header>
				<h1 itemprop="name">$Title</h1>
				<p>$DateRangeNice</p>
				<% if Websites %>
					<ul>
					<% loop Websites %>
						<li><a itemprop="sameAs" href="$Url" title="$Title">$Title</a></li>
					<% end_loop %>
					</ul>
				<% end_if %>
			</header>
			<section>$MarkdownedText</section>
			<aside>
				<% if Projects %>
					<p>Projects</p>
					<ul>
						<% loop Projects %>
							<% include CalendarAsideItem %>
						<% end_loop %>
					</ul>
				<% end_if %>

				<% if Exhibitions %>
					<p>Exhibitions</p>
					<ul>
						<% loop Exhibitions %>
							<% include CalendarAsideItem %>
						<% end_loop %>
					</ul>
				<% end_if %>

				<% if Excursions %>
					<p>Excursions</p>
					<ul>
						<% loop Excursions %>
							<% include CalendarAsideItem %>
						<% end_loop %>
					</ul>
				<% end_if %>

				<% if Workshops %>
					<p>Workshops</p>
					<ul>
						<% loop Workshops %>
							<% include CalendarAsideItem %>
						<% end_loop %>
					</ul>
				<% end_if %>
			</aside>
		</article>
	<% end_with %>
<% end_if %>