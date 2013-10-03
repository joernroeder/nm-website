<% if CalendarItem %>
	<% with CalendarItem %>
		<article>
			<header>
				<h1>$Title</h1>
				<p>$DateRangeNice</p>
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