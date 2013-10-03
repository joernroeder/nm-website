<% if Person %>
	<% with Person %>
		<article>
			<header>
				<p>
					<% if IsStudent %>
						Student<% if IsEmployee %>, <% end_if %>
					<% else %>
						<% if IsAlumni %>
							Alumni
						<% end_if %>
					<% end_if %>
					<% if IsEmployee %>$JobTitle<% end_if %>
					<% if Image %>
						<% with Image.Images.First %>
							<img src="$Link" />
						<% end_with %>
					<% end_if %>
				</p>
				<h1>$FullName</h1>
				<p>$MarkdownedBio</p>
			</header>

			<section>
				<% if Projects %>
					<% include ProjectOverview %>
				<% end_if %>
				<% if Exhibitions %>
					<% include ProjectOverview Projects=$Exhibitions %>
				<% end_if %>
				<% if Excursions %>
					<% include ProjectOverview Projects=$Excursions %>
				<% end_if %>
				<% if Workshops %>
					<% include ProjectOverview Projects=$Workshops %>
				<% end_if %>
			</section>
		</article>
	<% end_with %>
<% end_if %>