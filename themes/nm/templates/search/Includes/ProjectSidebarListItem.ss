<% loop Projects %>
	<% if IsPublished %>
		<li><a href="/
			<% if IsPortfolio %>
				portfolio
			<% else %>
				about/
				<% if not $Person %>
					Persons.First.UrlSlug
				<% else %>
					<% loop Persons %>
						<% if UrlSlug == Up.Person.UrlSlug %>
							$Up.Person.UrlSlug
						<% else %>
							<% if Last %>
								$Up.Persons.First.UrlSlug
							<% end_if %>
						<% end_if %>
					<% end_loop %>
				<% end_if %>
			<% end_if %>

		/{$UglyHash}/">$Title</a></li>
	<% end_if %>
<% end_loop %>